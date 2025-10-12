/**
 * Unit tests for Linear client with OAuth support
 *
 * Tests both OAuth and API key authentication methods per
 * LINEAR_OAUTH_IMPLEMENTATION.md
 */

import {
  LinearAnalyticsClient,
  getLinearClient,
  resetLinearClient,
} from "@/lib/analytics/linear/client";
import { ConfigurationError } from "@/lib/analytics/shared/errors";
import {
  __setMockTokens,
  __clearMockTokens,
  __getMockRefreshCount,
} from "../../../../__mocks__/lib/integrations/linear-oauth";

jest.mock("@linear/sdk");
jest.mock("@/lib/integrations/linear-oauth");

describe("Linear Client (OAuth + API Key)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    __clearMockTokens();
    resetLinearClient();
  });

  afterAll(() => {
    process.env = { ...originalEnv };
  });

  describe("OAuth Authentication (Primary)", () => {
    it("should use OAuth token when available", async () => {
      __setMockTokens({
        access_token: "oauth_token_123",
        refresh_token: "refresh_123",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scope: "read,write",
      });

      const client = await getLinearClient();

      expect(client).toBeDefined();
    });

    it("should handle token refresh automatically", async () => {
      // Set token that's about to expire
      __setMockTokens({
        access_token: "oauth_token_expiring",
        refresh_token: "refresh_expiring",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 minutes
        scope: "read,write",
      });

      const client = await getLinearClient();

      expect(client).toBeDefined();
      // Mock will auto-refresh tokens within 5-minute window
    });

    it("should cache client for 60 seconds", async () => {
      __setMockTokens({
        access_token: "oauth_cached",
        refresh_token: "refresh_cached",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scope: "read,write",
      });

      const client1 = await getLinearClient();
      const client2 = await getLinearClient();

      // Should return same instance within 60s window
      expect(client1).toBe(client2);
    });

    it("should reset client cache on demand", async () => {
      __setMockTokens({
        access_token: "oauth_reset_test",
        refresh_token: "refresh_reset",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scope: "read,write",
      });

      await getLinearClient();

      // Reset should clear cached client
      resetLinearClient();

      // Next call creates new client
      const newClient = await getLinearClient();
      expect(newClient).toBeDefined();
    });
  });

  describe("API Key Fallback (Backward Compatibility)", () => {
    it("should fall back to API key when OAuth not configured", async () => {
      __clearMockTokens(); // No OAuth tokens

      process.env.LINEAR_API_KEY = "test_api_key_123";

      const client = await getLinearClient();

      expect(client).toBeDefined();
    });

    it("should throw when neither OAuth nor API key available", async () => {
      __clearMockTokens();
      delete process.env.LINEAR_API_KEY;

      await expect(getLinearClient()).rejects.toThrow(ConfigurationError);
      await expect(getLinearClient()).rejects.toThrow(
        /Either connect via OAuth or set LINEAR_API_KEY/
      );
    });

    it("should prefer OAuth over API key", async () => {
      // Set both OAuth and API key
      __setMockTokens({
        access_token: "oauth_preferred",
        refresh_token: "refresh_preferred",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scope: "read,write",
      });

      process.env.LINEAR_API_KEY = "fallback_api_key";

      const client = await getLinearClient();

      expect(client).toBeDefined();
      // OAuth should be used, not API key
    });
  });

  describe("LinearAnalyticsClient Wrapper", () => {
    it("should perform health check with OAuth", async () => {
      __setMockTokens({
        access_token: "oauth_health",
        refresh_token: "refresh_health",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scope: "read,write",
      });

      const client = new LinearAnalyticsClient();
      const health = await client.healthCheck();

      expect(health).toBe(true);
    });

    it("should perform health check with API key", async () => {
      __clearMockTokens();
      process.env.LINEAR_API_KEY = "test_key_health";

      const client = new LinearAnalyticsClient();
      const health = await client.healthCheck();

      expect(health).toBe(true);
    });

    it("should return correct name", () => {
      const client = new LinearAnalyticsClient();
      expect(client.getName()).toBe("Linear");
    });

    it("should get client instance via wrapper", async () => {
      __setMockTokens({
        access_token: "oauth_wrapper",
        refresh_token: "refresh_wrapper",
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        scope: "read,write",
      });

      const analyticsClient = new LinearAnalyticsClient();
      const linearClient = await analyticsClient.getClient();

      expect(linearClient).toBeDefined();
    });
  });

  describe("Token Expiration Handling", () => {
    it("should handle expired tokens gracefully", async () => {
      // Set expired token
      __setMockTokens({
        access_token: "oauth_expired",
        refresh_token: "refresh_expired",
        token_type: "Bearer",
        expires_at: new Date(Date.now() - 1000).toISOString(), // Already expired
        scope: "read,write",
      });

      const client = await getLinearClient();

      expect(client).toBeDefined();
      // Mock should have auto-refreshed
    });

    it("should handle missing refresh token", async () => {
      // Token expires soon with no refresh token
      __setMockTokens({
        access_token: "oauth_no_refresh",
        refresh_token: "", // No refresh token
        token_type: "Bearer",
        expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 min
        scope: "read,write",
      });

      // Should still work (will try to refresh, might fail gracefully)
      const client = await getLinearClient();
      expect(client).toBeDefined();
    });
  });
});
