/**
 * Integration tests for authentication middleware
 *
 * ⚠️ REQUIRES Supabase for API key storage
 */

import {
  withApiKeyAuth,
  requireAdmin,
  generateApiKey,
  validateApiKey,
  listApiKeys,
  revokeApiKey,
} from "@/lib/auth/api-keys";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/analytics/shared/errors";
import { NextRequest } from "next/server";
import { isServiceConfigured } from "../../../setup/test-config-validator";

jest.mock("@supabase/supabase-js");
jest.mock("@clerk/nextjs/server");

describe("E2E: Authentication Middleware", () => {
  beforeAll(() => {
    if (!isServiceConfigured("Supabase")) {
      console.warn(
        "\n⚠️  Supabase not configured with real service role key.\n" +
          "Using mocks for authentication tests.\n"
      );
    }
  });
  describe("withApiKeyAuth", () => {
    it("should authenticate with valid API key", async () => {
      const apiKey = await generateApiKey("user_123", "Test Key");

      const request = new NextRequest("http://localhost:3000/api/test");
      request.headers.set("Authorization", `Bearer ${apiKey}`);

      const userId = await withApiKeyAuth(request);

      expect(userId).toBe("user_123");
    });

    it("should reject request with no authentication", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should reject request with invalid API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");
      request.headers.set("Authorization", "Bearer sk_analytics_invalid_key");

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should reject request with malformed Authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");
      request.headers.set("Authorization", "InvalidFormat");

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should reject request without Bearer prefix", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");
      request.headers.set("Authorization", "sk_analytics_key");

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe("requireAdmin", () => {
    it("should allow admin users", async () => {
      // Mock will need proper setup
      // In integration tests, we'd create an actual admin user
      await expect(requireAdmin("admin_user")).resolves.not.toThrow();
    });

    it("should reject non-admin users", async () => {
      await expect(requireAdmin("regular_user")).rejects.toThrow(
        AuthorizationError
      );
    });
  });

  describe("API Key Security", () => {
    it("should hash API keys (never store plain text)", async () => {
      const apiKey = await generateApiKey("user_security", "Security Test");

      // The API key itself should start with prefix
      expect(apiKey).toMatch(/^sk_analytics_/);

      // When we list keys, we should only see hashes
      const keys = await listApiKeys("user_security");
      const ourKey = keys.find((k) => k.key_name === "Security Test");

      expect(ourKey).toBeDefined();
      expect(ourKey?.key_hash).toBeDefined();
      expect(ourKey?.key_hash).not.toBe(apiKey); // Hash, not plain text
      expect(ourKey).not.toHaveProperty("key"); // Should never have plain text
    });

    it("should update last_used_at on validation", async () => {
      const apiKey = await generateApiKey("user_tracking", "Tracking Test");

      // First validation
      await validateApiKey(apiKey);

      const keys1 = await listApiKeys("user_tracking");
      const key1 = keys1.find((k) => k.key_name === "Tracking Test");

      expect(key1?.last_used_at).not.toBeNull();

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Second validation
      await validateApiKey(apiKey);

      const keys2 = await listApiKeys("user_tracking");
      const key2 = keys2.find((k) => k.key_name === "Tracking Test");

      // last_used_at should be updated
      expect(key2?.last_used_at).not.toBe(key1?.last_used_at);
    });

    it("should prevent reuse of revoked keys", async () => {
      const apiKey = await generateApiKey("user_revoke", "Revoke Test");

      // Validate works initially
      const userId1 = await validateApiKey(apiKey);
      expect(userId1).toBe("user_revoke");

      // Revoke the key
      const keys = await listApiKeys("user_revoke");
      const keyToRevoke = keys.find((k) => k.key_name === "Revoke Test");
      await revokeApiKey("user_revoke", keyToRevoke!.id);

      // Validation should now fail
      await expect(validateApiKey(apiKey)).rejects.toThrow(AuthenticationError);
    });
  });
});
