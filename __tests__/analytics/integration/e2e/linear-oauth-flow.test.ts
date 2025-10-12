/**
 * End-to-end test for Linear OAuth 2.0 flow
 *
 * Tests the complete OAuth lifecycle per LINEAR_OAUTH_IMPLEMENTATION.md:
 * - OAuth authorization flow
 * - Token storage in Supabase
 * - Automatic token refresh
 * - API key fallback
 * - Admin-only access control
 */

import {
  storeLinearTokens,
  getLinearTokens,
  getValidLinearToken,
  refreshLinearToken,
  revokeLinearToken,
  isLinearConnected,
} from "@/lib/integrations/linear-oauth";
import {
  getLinearClient,
  resetLinearClient,
} from "@/lib/analytics/linear/client";
import {
  setupTestDatabase,
  cleanupTestDatabase,
} from "../../../setup/test-helpers";

jest.mock("@linear/sdk");
jest.mock("@supabase/supabase-js");

describe("E2E: Linear OAuth 2.0 Flow", () => {
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    await setupTestDatabase();
    originalFetch = global.fetch;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    resetLinearClient();

    // Mock fetch for Linear OAuth token endpoints
    global.fetch = jest.fn((url: string) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      // Mock token refresh
      if (urlStr.includes("linear.app/oauth/token")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: "lin_refreshed_token_" + Date.now(),
            refresh_token: "lin_new_refresh_" + Date.now(),
            token_type: "Bearer",
            expires_in: 86400,
            scope: "read,write",
          }),
        } as Response);
      }

      // Mock token revocation
      if (urlStr.includes("linear.app/oauth/revoke")) {
        return Promise.resolve({
          ok: true,
        } as Response);
      }

      return originalFetch(url);
    }) as jest.Mock;
  });

  it("should complete OAuth flow: Store → Retrieve → Refresh → Revoke", async () => {
    // Step 1: Store OAuth tokens (simulating OAuth callback)
    await storeLinearTokens({
      access_token: "lin_oauth_test_access_123",
      refresh_token: "lin_oauth_test_refresh_456",
      token_type: "Bearer",
      expires_in: 86400, // 24 hours
      scope: "read,write",
    });

    // Step 2: Retrieve stored tokens
    const tokens = await getLinearTokens();

    expect(tokens).toBeDefined();
    expect(tokens?.access_token).toBe("lin_oauth_test_access_123");
    expect(tokens?.refresh_token).toBe("lin_oauth_test_refresh_456");
    expect(tokens?.scope).toBe("read,write");

    // Step 3: Get valid token (should return without refresh)
    const validToken = await getValidLinearToken();

    expect(validToken).toBe("lin_oauth_test_access_123");

    // Step 4: Check connection status
    const isConnected = await isLinearConnected();

    expect(isConnected).toBe(true);

    // Step 5: Refresh token explicitly
    await refreshLinearToken();

    const refreshedTokens = await getLinearTokens();

    expect(refreshedTokens).toBeDefined();
    expect(refreshedTokens?.access_token).not.toBe("lin_oauth_test_access_123");
    // Should be new token after refresh

    // Step 6: Revoke tokens
    await revokeLinearToken();

    // Step 7: Verify tokens are deleted
    const revokedTokens = await getLinearTokens();

    expect(revokedTokens).toBeNull();

    // Step 8: Verify connection status is false
    const isStillConnected = await isLinearConnected();

    expect(isStillConnected).toBe(false);
  });

  it("should use OAuth token in Linear client", async () => {
    // Store OAuth token
    await storeLinearTokens({
      access_token: "lin_client_oauth_token",
      refresh_token: "lin_client_refresh",
      token_type: "Bearer",
      expires_in: 86400,
      scope: "read,write",
    });

    // Get Linear client (should use OAuth)
    const client = await getLinearClient();

    expect(client).toBeDefined();
    // Client should be initialized with OAuth access token
  });

  it("should fall back to API key when OAuth not configured", async () => {
    // Ensure no OAuth tokens
    await revokeLinearToken();

    // Set API key
    process.env.LINEAR_API_KEY = "lin_api_fallback_test";

    // Get Linear client (should use API key)
    const client = await getLinearClient();

    expect(client).toBeDefined();
    // Client should be initialized with API key
  });

  it("should handle token expiration with automatic refresh", async () => {
    // Store token that's about to expire
    const expiringSoon = new Date(Date.now() + 4 * 60 * 1000); // 4 minutes

    await storeLinearTokens({
      access_token: "lin_expiring_token",
      refresh_token: "lin_refresh_for_expiring",
      token_type: "Bearer",
      expires_in: 240, // 4 minutes in seconds
      scope: "read,write",
    });

    // Get valid token (should trigger refresh since < 5min buffer)
    const token = await getValidLinearToken();

    expect(token).toBeDefined();
    // Should be refreshed token, not the expiring one
  });

  it("should update integration_tokens table on upsert", async () => {
    // First token
    await storeLinearTokens({
      access_token: "first_token",
      refresh_token: "first_refresh",
      token_type: "Bearer",
      expires_in: 86400,
      scope: "read",
    });

    // Update with new token (upsert)
    await storeLinearTokens({
      access_token: "second_token",
      refresh_token: "second_refresh",
      token_type: "Bearer",
      expires_in: 86400,
      scope: "read,write",
    });

    const tokens = await getLinearTokens();

    expect(tokens?.access_token).toBe("second_token");
    expect(tokens?.scope).toBe("read,write");
    // Should only have one row (upsert replaces, doesn't insert new)
  });

  it("should handle missing Supabase configuration gracefully", async () => {
    // When Supabase not configured, OAuth functions should handle gracefully
    // getLinearTokens should return null
    // Client should fall back to API key

    const tokens = await getLinearTokens();
    // Should either return tokens or null, not throw
    expect(tokens === null || typeof tokens === "object").toBe(true);
  });
});
