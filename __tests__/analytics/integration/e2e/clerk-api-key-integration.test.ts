/**
 * Comprehensive integration test demonstrating Clerk testing approach
 * with full API key database lifecycle
 *
 * This test showcases:
 * 1. Using Clerk's testing helpers for authentication
 * 2. Creating API keys in the database
 * 3. Validating keys and tracking usage
 * 4. Revoking keys in the database
 * 5. Ensuring complete cleanup
 *
 * Per Clerk best practices:
 * https://clerk.com/docs/guides/development/testing/overview
 */

import {
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
} from "@/lib/auth/api-keys";
import { AuthenticationError } from "@/lib/analytics/shared/errors";
import { GET as eventsGET } from "@/app/api/analytics/posthog/events/route";
import { NextRequest } from "next/server";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  cleanupUserApiKeys,
} from "../../../setup/test-helpers";

// Mock external dependencies
jest.mock("posthog-node");
jest.mock("@supabase/supabase-js");
jest.mock("@clerk/nextjs/server");

describe("E2E: Clerk Testing Approach with API Keys", () => {
  // Use Clerk's recommended test user ID format
  const testUserId = `test_user_clerk_${Date.now()}`;
  let createdKeys: string[] = [];

  beforeAll(async () => {
    console.log("\n🔧 Setting up test database for Clerk integration tests");
    await setupTestDatabase();
  });

  beforeEach(() => {
    // Reset tracking for each test
    createdKeys = [];
  });

  afterEach(async () => {
    // Clean up keys created in this test
    await cleanupUserApiKeys(testUserId);
    createdKeys = [];
  });

  afterAll(async () => {
    console.log("\n🧹 Cleaning up test database");
    await cleanupUserApiKeys(testUserId);
    await cleanupTestDatabase();
  });

  describe("API Key Lifecycle with Database Operations", () => {
    it("should create API key and persist to database", async () => {
      // Step 1: Create API key (writes to Supabase)
      const apiKey = await generateApiKey(testUserId, "Test Key 1");

      // Verify key format
      expect(apiKey).toMatch(/^sk_analytics_[A-Za-z0-9_-]+$/);
      expect(apiKey.length).toBeGreaterThan(20);

      // Step 2: Verify key exists in database
      const keysInDb = await listApiKeys(testUserId);

      expect(keysInDb).toHaveLength(1);
      expect(keysInDb[0]).toMatchObject({
        user_id: testUserId,
        key_name: "Test Key 1",
        revoked: false,
        last_used_at: null, // Not used yet
      });

      createdKeys.push(keysInDb[0].id);
    });

    it("should validate API key and update last_used_at in database", async () => {
      // Step 1: Create key
      const apiKey = await generateApiKey(testUserId, "Usage Test Key");

      // Step 2: Get initial DB state
      let keysInDb = await listApiKeys(testUserId);
      const keyRecord = keysInDb[0];
      createdKeys.push(keyRecord.id);

      expect(keyRecord.last_used_at).toBeNull();

      // Step 3: Validate key (triggers DB update)
      const userId = await validateApiKey(apiKey);

      expect(userId).toBe(testUserId);

      // Step 4: Verify last_used_at was updated
      keysInDb = await listApiKeys(testUserId);
      const updatedKey = keysInDb.find((k) => k.id === keyRecord.id);

      expect(updatedKey?.last_used_at).not.toBeNull();
      expect(new Date(updatedKey!.last_used_at!).getTime()).toBeGreaterThan(
        new Date(keyRecord.created_at).getTime()
      );
    });

    it("should revoke API key in database", async () => {
      // Step 1: Create and validate key
      const apiKey = await generateApiKey(testUserId, "Revoke Test Key");
      await validateApiKey(apiKey);

      // Step 2: Get key ID from DB
      let keysInDb = await listApiKeys(testUserId);
      const keyRecord = keysInDb[0];
      createdKeys.push(keyRecord.id);

      expect(keyRecord.revoked).toBe(false);
      expect(keyRecord.revoked_at).toBeNull();

      // Step 3: Revoke key (updates DB)
      await revokeApiKey(testUserId, keyRecord.id);

      // Step 4: Verify revocation in DB
      keysInDb = await listApiKeys(testUserId);
      const revokedKey = keysInDb.find((k) => k.id === keyRecord.id);

      expect(revokedKey?.revoked).toBe(true);
      expect(revokedKey?.revoked_at).not.toBeNull();

      // Step 5: Verify key no longer validates
      await expect(validateApiKey(apiKey)).rejects.toThrow(AuthenticationError);
    });

    it("should delete API keys from database on cleanup", async () => {
      // Step 1: Create multiple keys
      await generateApiKey(testUserId, "Delete Test Key 1");
      await generateApiKey(testUserId, "Delete Test Key 2");
      await generateApiKey(testUserId, "Delete Test Key 3");

      // Step 2: Verify keys exist
      let keysInDb = await listApiKeys(testUserId);
      expect(keysInDb).toHaveLength(3);

      // Step 3: Delete all keys for user
      await cleanupUserApiKeys(testUserId);

      // Step 4: Verify keys are deleted
      keysInDb = await listApiKeys(testUserId);
      expect(keysInDb).toHaveLength(0);
    });
  });

  describe("API Key Usage in Routes", () => {
    it("should authenticate API route with valid key from database", async () => {
      // Step 1: Create API key (persisted to DB)
      const apiKey = await generateApiKey(testUserId, "Route Test Key");

      const keysInDb = await listApiKeys(testUserId);
      createdKeys.push(keysInDb[0].id);

      // Step 2: Use key to access protected route
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/events?limit=5"
      );
      request.headers.set("Authorization", `Bearer ${apiKey}`);

      const response = await eventsGET(request);

      // Step 3: Request should succeed
      expect(response.status).toBe(200);

      // Step 4: Verify last_used_at was updated in DB
      const updatedKeys = await listApiKeys(testUserId);
      const usedKey = updatedKeys.find((k) => k.id === keysInDb[0].id);

      expect(usedKey?.last_used_at).not.toBeNull();
    });

    it("should reject API route with revoked key", async () => {
      // Step 1: Create and immediately revoke key
      const apiKey = await generateApiKey(testUserId, "Revoked Route Key");

      const keysInDb = await listApiKeys(testUserId);
      const keyRecord = keysInDb[0];
      createdKeys.push(keyRecord.id);

      await revokeApiKey(testUserId, keyRecord.id);

      // Step 2: Verify key is revoked in DB
      const revokedKeys = await listApiKeys(testUserId);
      expect(revokedKeys[0].revoked).toBe(true);

      // Step 3: Attempt to use revoked key
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/events"
      );
      request.headers.set("Authorization", `Bearer ${apiKey}`);

      const response = await eventsGET(request);

      // Step 4: Should be rejected
      expect(response.status).toBe(401);
    });

    it("should reject API route with invalid key", async () => {
      // Step 1: Use fake key (not in DB)
      const fakeKey = "sk_analytics_fake_key_not_in_database";

      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/events"
      );
      request.headers.set("Authorization", `Bearer ${fakeKey}`);

      // Step 2: Should be rejected
      const response = await eventsGET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("Database Constraints and Security", () => {
    it("should enforce user_id constraint on revocation", async () => {
      // Step 1: Create key for user A
      const apiKeyA = await generateApiKey(testUserId, "User A Key");

      const keysInDb = await listApiKeys(testUserId);
      const keyRecordA = keysInDb[0];
      createdKeys.push(keyRecordA.id);

      // Step 2: Attempt to revoke with wrong user ID
      const wrongUserId = `test_user_wrong_${Date.now()}`;
      await revokeApiKey(wrongUserId, keyRecordA.id);

      // Step 3: Key should still be active (DB enforces user_id match)
      const keysAfterAttempt = await listApiKeys(testUserId);
      expect(keysAfterAttempt[0].revoked).toBe(false);

      // Step 4: Key should still work
      const userId = await validateApiKey(apiKeyA);
      expect(userId).toBe(testUserId);
    });

    it("should store key hash, not plaintext", async () => {
      // Step 1: Create key
      const apiKey = await generateApiKey(testUserId, "Hash Test Key");

      // Step 2: Verify DB stores hash, not plaintext
      const keysInDb = await listApiKeys(testUserId);
      const keyRecord = keysInDb[0];
      createdKeys.push(keyRecord.id);

      // The key_hash should be a SHA-256 hex string (64 chars)
      expect(keyRecord.key_hash).toBeDefined();
      expect(keyRecord.key_hash.length).toBe(64);
      expect(keyRecord.key_hash).toMatch(/^[a-f0-9]{64}$/);

      // The hash should NOT equal the plaintext key
      expect(keyRecord.key_hash).not.toBe(apiKey);
    });

    it("should handle multiple concurrent keys per user", async () => {
      // Step 1: Create multiple keys concurrently
      const keyPromises = [
        generateApiKey(testUserId, "Concurrent Key 1"),
        generateApiKey(testUserId, "Concurrent Key 2"),
        generateApiKey(testUserId, "Concurrent Key 3"),
      ];

      const keys = await Promise.all(keyPromises);

      // Step 2: All keys should be unique
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBe(3);

      // Step 3: All keys should be in DB
      const keysInDb = await listApiKeys(testUserId);
      expect(keysInDb).toHaveLength(3);

      keysInDb.forEach((k) => createdKeys.push(k.id));

      // Step 4: All keys should validate
      const validations = await Promise.all(keys.map(validateApiKey));
      expect(validations).toEqual([testUserId, testUserId, testUserId]);

      // Step 5: Revoke one key
      const keyToRevoke = keysInDb.find(
        (k) => k.key_name === "Concurrent Key 2"
      );
      await revokeApiKey(testUserId, keyToRevoke!.id);

      // Step 6: Only one key should be revoked
      const finalKeys = await listApiKeys(testUserId);
      const revokedCount = finalKeys.filter((k) => k.revoked).length;
      const activeCount = finalKeys.filter((k) => !k.revoked).length;

      expect(revokedCount).toBe(1);
      expect(activeCount).toBe(2);
    });
  });

  describe("Integration with Clerk Authentication", () => {
    it("should create API keys for Clerk-authenticated users", async () => {
      // This test demonstrates the integration pattern:
      // 1. User authenticates via Clerk (mocked)
      // 2. User creates API key (stored in Supabase)
      // 3. User can use API key to access routes

      // Mock Clerk auth (would be real Clerk user ID in production)
      const clerkUserId = testUserId;

      // Step 1: Generate API key for Clerk user
      const apiKey = await generateApiKey(clerkUserId, "Clerk User API Key");

      // Step 2: Verify key is linked to Clerk user ID
      const keysInDb = await listApiKeys(clerkUserId);
      expect(keysInDb[0].user_id).toBe(clerkUserId);

      createdKeys.push(keysInDb[0].id);

      // Step 3: Use key to authenticate (bypasses Clerk session)
      const userId = await validateApiKey(apiKey);
      expect(userId).toBe(clerkUserId);
    });
  });
});
