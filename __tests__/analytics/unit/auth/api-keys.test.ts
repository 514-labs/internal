/**
 * Unit tests for API key management
 */

import {
  generateApiKey,
  validateApiKey,
  revokeApiKey,
  listApiKeys,
  withApiKeyAuth,
  requireAdmin,
} from "@/lib/auth/api-keys";
import {
  AuthenticationError,
  AuthorizationError,
} from "@/lib/analytics/shared/errors";
import { NextRequest } from "next/server";

jest.mock("@supabase/supabase-js");
jest.mock("@clerk/nextjs/server");

describe("API Key Management", () => {
  describe("generateApiKey", () => {
    it("should generate API key with correct prefix", async () => {
      const apiKey = await generateApiKey("user_123", "Test Key");

      expect(apiKey).toMatch(/^sk_analytics_/);
      expect(apiKey.length).toBeGreaterThan(20);
    });

    it("should generate unique keys", async () => {
      const key1 = await generateApiKey("user_123", "Key 1");
      const key2 = await generateApiKey("user_123", "Key 2");

      expect(key1).not.toBe(key2);
    });

    it("should work without key name", async () => {
      const apiKey = await generateApiKey("user_123");

      expect(apiKey).toMatch(/^sk_analytics_/);
    });
  });

  describe("validateApiKey", () => {
    it("should reject key without correct prefix", async () => {
      await expect(validateApiKey("invalid_key")).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should reject empty key", async () => {
      await expect(validateApiKey("")).rejects.toThrow(AuthenticationError);
    });

    it("should validate correct key format", async () => {
      // Generate a real API key
      const apiKey = await generateApiKey("user_validate", "Validate Test");

      // Validate it
      const userId = await validateApiKey(apiKey);

      expect(userId).toBe("user_123"); // From mock
    });

    it("should reject key that doesn't exist in database", async () => {
      // Use "invalid" in the key which the mock will reject
      const invalidKey = "sk_analytics_invalid_key_for_testing";

      await expect(validateApiKey(invalidKey)).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe("revokeApiKey", () => {
    it("should revoke API key", async () => {
      await expect(revokeApiKey("user_123", "key_456")).resolves.not.toThrow();
    });
  });

  describe("listApiKeys", () => {
    it("should list user's API keys", async () => {
      const keys = await listApiKeys("user_123");

      expect(Array.isArray(keys)).toBe(true);
    });

    it("should not include plain text keys", async () => {
      const keys = await listApiKeys("user_123");

      keys.forEach((key) => {
        expect(key).not.toHaveProperty("key");
        expect(key).toHaveProperty("key_hash");
      });
    });
  });

  describe("withApiKeyAuth", () => {
    it("should authenticate with valid API key", async () => {
      // Generate a valid API key first
      const apiKey = await generateApiKey("user_auth", "Auth Test");

      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const userId = await withApiKeyAuth(request);

      expect(userId).toBe("user_123"); // From mock
    });

    it("should reject request without Authorization header and no session", async () => {
      const request = new NextRequest("http://localhost:3000/api/test");

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should reject malformed Authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Authorization: "InvalidFormat",
        },
      });

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });

    it("should reject invalid API key", async () => {
      const request = new NextRequest("http://localhost:3000/api/test", {
        headers: {
          Authorization: "Bearer sk_analytics_invalid",
        },
      });

      await expect(withApiKeyAuth(request)).rejects.toThrow(
        AuthenticationError
      );
    });
  });

  describe("requireAdmin", () => {
    it("should allow admin users", async () => {
      // Mock will need to be set up for this
      // In real tests, we'd mock clerkClient to return admin user
      await expect(requireAdmin("admin_user")).resolves.not.toThrow();
    });

    it("should reject non-admin users", async () => {
      await expect(requireAdmin("regular_user")).rejects.toThrow(
        AuthorizationError
      );
    });
  });
});
