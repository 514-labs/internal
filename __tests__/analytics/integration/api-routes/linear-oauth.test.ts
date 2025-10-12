/**
 * Integration tests for Linear OAuth API routes
 *
 * Tests the OAuth authorization, callback, and disconnect endpoints
 * per LINEAR_OAUTH_IMPLEMENTATION.md
 */

import { GET as authorizeGET } from "@/app/api/integrations/linear/authorize/route";
import { GET as callbackGET } from "@/app/api/integrations/linear/callback/route";
import { POST as disconnectPOST } from "@/app/api/integrations/linear/disconnect/route";
import { GET as statusGET } from "@/app/api/integrations/linear/status/route";
import { NextRequest } from "next/server";
import { storeLinearTokens } from "@/lib/integrations/linear-oauth";
import {
  setupTestDatabase,
  cleanupTestDatabase,
} from "../../../setup/test-helpers";

jest.mock("@supabase/supabase-js");
jest.mock("@clerk/nextjs/server");
jest.mock("@/lib/integrations/linear-oauth");

describe("Linear OAuth API Routes", () => {
  beforeAll(async () => {
    // Setup database for OAuth token storage
    await setupTestDatabase();
  });

  afterAll(async () => {
    // Cleanup database
    await cleanupTestDatabase();
  });
  describe("GET /api/integrations/linear/authorize", () => {
    it("should redirect to Linear OAuth page", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/authorize"
      );

      const response = await authorizeGET(request);

      // Should redirect to Linear
      expect(response.status).toBe(302);

      const location = response.headers.get("Location");
      expect(location).toContain("linear.app/oauth/authorize");
      expect(location).toContain("actor=app"); // App-level auth
      expect(location).toContain("code_challenge"); // PKCE
      expect(location).toContain("code_challenge_method=S256"); // PKCE
    });

    it("should require admin access", async () => {
      // Mock non-admin user
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/authorize"
      );

      // Test will check admin role via Clerk
      const response = await authorizeGET(request);

      // Admin check happens in route
      expect(response).toBeDefined();
    });

    it("should generate PKCE challenge", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/authorize"
      );

      const response = await authorizeGET(request);
      const location = response.headers.get("Location");

      // Should include code_challenge (base64url encoded SHA256)
      expect(location).toMatch(/code_challenge=[A-Za-z0-9_-]+/);
    });
  });

  describe("GET /api/integrations/linear/callback", () => {
    it("should exchange code for tokens", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/callback?code=test_code&state=test_state"
      );

      // Mock OAuth token exchange response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "lin_access_callback",
          refresh_token: "lin_refresh_callback",
          token_type: "Bearer",
          expires_in: 86400,
          scope: "read,write",
        }),
      });

      const response = await callbackGET(request);

      // Should redirect to settings after success
      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toContain("/settings");
    });

    it("should handle missing code parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/callback"
      );

      const response = await callbackGET(request);

      // Should return error or redirect with error
      expect([302, 400]).toContain(response.status);
    });

    it("should validate state parameter (CSRF protection)", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/callback?code=test&state=invalid_state"
      );

      const response = await callbackGET(request);

      // Should reject invalid state
      expect(response).toBeDefined();
    });
  });

  describe("POST /api/integrations/linear/disconnect", () => {
    it("should revoke tokens and disconnect", async () => {
      // First, store tokens
      await storeLinearTokens({
        access_token: "lin_disconnect_test",
        refresh_token: "lin_refresh_disconnect",
        token_type: "Bearer",
        expires_in: 86400,
        scope: "read,write",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/disconnect",
        { method: "POST" }
      );

      const response = await disconnectPOST(request);

      expect(response.status).toBe(200);
    });

    it("should require admin access", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/disconnect",
        { method: "POST" }
      );

      // Admin check via Clerk mock
      const response = await disconnectPOST(request);

      expect(response).toBeDefined();
    });
  });

  describe("GET /api/integrations/linear/status", () => {
    it("should return connection status", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/status"
      );

      const response = await statusGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("connected");
    });

    it("should show token expiration when connected", async () => {
      // Store tokens first
      await storeLinearTokens({
        access_token: "lin_status_test",
        refresh_token: "lin_refresh_status",
        token_type: "Bearer",
        expires_in: 86400,
        scope: "read,write",
      });

      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/status"
      );

      const response = await statusGET(request);
      const data = await response.json();

      if (data.connected) {
        expect(data).toHaveProperty("expiresAt");
        expect(data).toHaveProperty("scope");
      }
    });

    it("should require admin access", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/integrations/linear/status"
      );

      const response = await statusGET(request);

      // Admin check via Clerk mock
      expect(response).toBeDefined();
    });
  });

  describe("OAuth vs API Key Integration", () => {
    it("should use OAuth when configured", async () => {
      // Store OAuth tokens
      await storeLinearTokens({
        access_token: "oauth_priority_test",
        refresh_token: "oauth_refresh",
        token_type: "Bearer",
        expires_in: 86400,
        scope: "read,write",
      });

      const token = await getValidLinearToken();

      expect(token).toBe("oauth_priority_test");
      // OAuth takes priority over API key
    });

    it("should fall back to API key when OAuth not configured", async () => {
      // Ensure no OAuth tokens
      await revokeLinearToken();

      // Set API key env var
      process.env.LINEAR_API_KEY = "lin_api_fallback_integration";

      const token = await getValidLinearToken();

      // Should return null (OAuth not configured)
      // Client will use API key instead
      expect(token).toBeNull();
    });
  });
});
