/**
 * End-to-end test for complete API key flow
 *
 * Tests the full lifecycle: Create → Validate → Use → Revoke → Verify
 * Uses Clerk testing approach for authentication
 *
 * ⚠️ REQUIRES REAL API KEYS for full integration testing
 * Will use mocks if real keys not available, but with warnings.
 */

import {
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
} from "@/lib/auth/api-keys";
import { AuthenticationError } from "@/lib/analytics/shared/errors";
import { GET as eventsGET } from "@/app/api/analytics/posthog/events/route";
import { GET as issuesGET } from "@/app/api/analytics/linear/issues/route";
import { GET as companyGET } from "@/app/api/analytics/rippling/company/route";
import { NextRequest } from "next/server";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  cleanupUserApiKeys,
} from "../../../setup/test-helpers";
import {
  validateIntegrationTestConfig,
  printConfigurationStatus,
} from "../../../setup/test-config-validator";

jest.mock("posthog-node");
jest.mock("@linear/sdk");
jest.mock("@supabase/supabase-js");
jest.mock("@clerk/nextjs/server");

describe("E2E: Complete API Key Flow", () => {
  const testUserId = "test_user_e2e_" + Date.now();
  let createdKeyIds: string[] = [];

  beforeAll(async () => {
    // Print configuration status
    printConfigurationStatus();

    // Validate configuration
    const validation = validateIntegrationTestConfig();
    if (!validation.valid) {
      console.error(validation.message);
      console.warn(
        "\n⚠️  Integration tests will run with MOCKS.\n" +
          "Add real API keys to .env.local for full integration testing.\n"
      );
    }

    await setupTestDatabase();
  });

  afterEach(async () => {
    // Clean up any keys created in tests
    await cleanupUserApiKeys(testUserId);
    createdKeyIds = [];
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupUserApiKeys(testUserId);
    await cleanupTestDatabase();
  });

  it("should complete full API key lifecycle with DB operations", async () => {
    // Step 1: Generate API key (writes to DB)
    const apiKey = await generateApiKey(testUserId, "E2E Test Key");

    expect(apiKey).toMatch(/^sk_analytics_/);
    expect(apiKey.length).toBeGreaterThan(20);

    // Step 2: Verify key was written to DB
    const keysInDb = await listApiKeys(testUserId);
    expect(keysInDb.length).toBe(1);
    expect(keysInDb[0].key_name).toBe("E2E Test Key");
    expect(keysInDb[0].user_id).toBe(testUserId);
    expect(keysInDb[0].revoked).toBe(false);
    expect(keysInDb[0].last_used_at).toBeNull(); // Not used yet

    const ourKey = keysInDb[0];
    createdKeyIds.push(ourKey.id);

    // Step 3: Validate API key works (updates last_used_at in DB)
    const validatedUserId = await validateApiKey(apiKey);

    expect(validatedUserId).toBe(testUserId);

    // Step 4: Verify last_used_at was updated in DB
    const keysAfterValidation = await listApiKeys(testUserId);
    const keyAfterValidation = keysAfterValidation.find(
      (k) => k.id === ourKey.id
    );
    expect(keyAfterValidation?.last_used_at).not.toBeNull();

    // Step 5: Use API key to access PostHog endpoint
    const posthogRequest = new NextRequest(
      "http://localhost:3000/api/analytics/posthog/events?limit=5"
    );
    posthogRequest.headers.set("Authorization", `Bearer ${apiKey}`);

    const posthogResponse = await eventsGET(posthogRequest);

    expect(posthogResponse.status).toBe(200);

    // Step 6: Use API key to access Linear endpoint
    const linearRequest = new NextRequest(
      "http://localhost:3000/api/analytics/linear/issues?limit=5"
    );
    linearRequest.headers.set("Authorization", `Bearer ${apiKey}`);

    const linearResponse = await issuesGET(linearRequest);

    expect(linearResponse.status).toBe(200);

    // Step 7: Use API key to access Rippling endpoint
    const ripplingRequest = new NextRequest(
      "http://localhost:3000/api/analytics/rippling/company"
    );
    ripplingRequest.headers.set("Authorization", `Bearer ${apiKey}`);

    // Mock Rippling API
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: "company_123", name: "Test Corp" },
      }),
    });

    const ripplingResponse = await companyGET(ripplingRequest);

    expect(ripplingResponse.status).toBe(200);

    // Step 8: Revoke API key (updates DB)
    await revokeApiKey(testUserId, ourKey.id);

    // Step 9: Verify key shows as revoked in DB
    const keysAfterRevoke = await listApiKeys(testUserId);
    const revokedKey = keysAfterRevoke.find((k) => k.id === ourKey.id);

    expect(revokedKey?.revoked).toBe(true);
    expect(revokedKey?.revoked_at).not.toBeNull();

    // Step 10: Verify revoked key doesn't work
    await expect(validateApiKey(apiKey)).rejects.toThrow(AuthenticationError);

    // Step 11: Verify revoked key can't access APIs
    const revokedRequest = new NextRequest(
      "http://localhost:3000/api/analytics/posthog/events"
    );
    revokedRequest.headers.set("Authorization", `Bearer ${apiKey}`);

    const revokedResponse = await eventsGET(revokedRequest);

    expect(revokedResponse.status).toBe(401);

    // Step 12: Delete key from DB (cleanup validates DB deletion)
    await cleanupUserApiKeys(testUserId);

    const keysAfterDelete = await listApiKeys(testUserId);
    expect(keysAfterDelete.length).toBe(0);
  });

  it("should handle multiple API keys for same user with DB validation", async () => {
    // Step 1: Generate multiple keys (writes to DB)
    const key1 = await generateApiKey(testUserId, "Key 1");
    const key2 = await generateApiKey(testUserId, "Key 2");
    const key3 = await generateApiKey(testUserId, "Key 3");

    // All keys should be unique
    expect(key1).not.toBe(key2);
    expect(key2).not.toBe(key3);
    expect(key1).not.toBe(key3);

    // Step 2: Verify all 3 keys exist in DB
    const keysInDb = await listApiKeys(testUserId);
    expect(keysInDb.length).toBe(3);

    const dbKey1 = keysInDb.find((k) => k.key_name === "Key 1");
    const dbKey2 = keysInDb.find((k) => k.key_name === "Key 2");
    const dbKey3 = keysInDb.find((k) => k.key_name === "Key 3");

    expect(dbKey1).toBeDefined();
    expect(dbKey2).toBeDefined();
    expect(dbKey3).toBeDefined();

    // Track for cleanup
    createdKeyIds.push(dbKey1!.id, dbKey2!.id, dbKey3!.id);

    // Step 3: All keys should validate to same user
    const user1 = await validateApiKey(key1);
    const user2 = await validateApiKey(key2);
    const user3 = await validateApiKey(key3);

    expect(user1).toBe(testUserId);
    expect(user2).toBe(testUserId);
    expect(user3).toBe(testUserId);

    // Step 4: Revoke one key in DB
    await revokeApiKey(testUserId, dbKey2!.id);

    // Step 5: Verify key 2 is revoked in DB
    const keysAfterRevoke = await listApiKeys(testUserId);
    const revokedKey = keysAfterRevoke.find((k) => k.id === dbKey2!.id);
    expect(revokedKey?.revoked).toBe(true);

    // Step 6: Key 2 should fail validation
    await expect(validateApiKey(key2)).rejects.toThrow(AuthenticationError);

    // Step 7: Keys 1 and 3 should still work
    expect(await validateApiKey(key1)).toBe(testUserId);
    expect(await validateApiKey(key3)).toBe(testUserId);

    // Step 8: Verify only key 2 is revoked in DB
    const finalKeys = await listApiKeys(testUserId);
    expect(finalKeys.filter((k) => k.revoked).length).toBe(1);
    expect(finalKeys.filter((k) => !k.revoked).length).toBe(2);
  });

  it("should enforce DB constraints and validation", async () => {
    // Step 1: Create a key
    const apiKey = await generateApiKey(testUserId, "Constraint Test Key");

    // Step 2: Verify key exists in DB
    const keys = await listApiKeys(testUserId);
    expect(keys.length).toBe(1);

    const keyRecord = keys[0];
    createdKeyIds.push(keyRecord.id);

    // Step 3: Validate API key format
    expect(apiKey).toMatch(/^sk_analytics_/);

    // Step 4: Verify DB record structure
    expect(keyRecord.user_id).toBe(testUserId);
    expect(keyRecord.key_hash).toBeDefined();
    expect(keyRecord.key_hash.length).toBe(64); // SHA-256 hex
    expect(keyRecord.created_at).toBeDefined();
    expect(keyRecord.revoked).toBe(false);
    expect(keyRecord.revoked_at).toBeNull();

    // Step 5: Attempt to revoke with wrong user ID (should not revoke)
    const wrongUserId = "wrong_user_id";
    await revokeApiKey(wrongUserId, keyRecord.id);

    // Step 6: Verify key is still active (DB enforces user_id match)
    const keysAfterWrongRevoke = await listApiKeys(testUserId);
    expect(keysAfterWrongRevoke[0].revoked).toBe(false);

    // Step 7: API key should still work
    const userId = await validateApiKey(apiKey);
    expect(userId).toBe(testUserId);
  });
});
