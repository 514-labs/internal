/**
 * Integration tests for Linear API routes
 *
 * ⚠️ REQUIRES REAL API KEYS
 * These tests call actual Linear APIs. Set these environment variables:
 * - LINEAR_API_KEY (not test_linear_key)
 */

import { GET as issuesGET } from "@/app/api/analytics/linear/issues/route";
import { GET as projectsGET } from "@/app/api/analytics/linear/projects/route";
import { GET as initiativesGET } from "@/app/api/analytics/linear/initiatives/route";
import { GET as usersGET } from "@/app/api/analytics/linear/users/route";
import { NextRequest } from "next/server";
import { generateApiKey, listApiKeys, revokeApiKey } from "@/lib/auth/api-keys";
import { isServiceConfigured } from "../../../setup/test-config-validator";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  cleanupUserApiKeys,
} from "../../../setup/test-helpers";

jest.mock("@linear/sdk");
jest.mock("@supabase/supabase-js");

describe("Linear API Routes", () => {
  let testApiKey: string;
  const testUserId = "test_user_linear_" + Date.now();
  let apiKeyIds: string[] = [];

  beforeAll(async () => {
    // Setup database
    await setupTestDatabase();

    // Check if Linear OAuth is configured
    if (!isServiceConfigured("Linear OAuth")) {
      console.warn(
        "\n⚠️  Linear OAuth integration tests will use MOCKS.\n" +
          "\n" +
          "Linear requires OAuth 2.0 credentials:\n" +
          "  Get from: https://linear.app/settings/api/applications\n" +
          "  Set in .env.local:\n" +
          "    LINEAR_CLIENT_ID=your_client_id\n" +
          "    LINEAR_CLIENT_SECRET=your_client_secret\n" +
          "    LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback\n" +
          "\n" +
          "Then connect via /settings/integrations to get OAuth tokens.\n"
      );
    } else {
      console.log(
        "\n✅ Linear OAuth configured.\n" +
          "   CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI are set.\n" +
          "   Connect via /settings/integrations to get access tokens.\n"
      );
    }
  });

  beforeEach(async () => {
    // Create fresh API key for each test
    testApiKey = await generateApiKey(testUserId, "Linear Test Key");

    // Track key for cleanup
    const keys = await listApiKeys(testUserId);
    const newKey = keys.find((k) => k.key_name === "Linear Test Key");
    if (newKey) {
      apiKeyIds.push(newKey.id);
    }
  });

  afterEach(async () => {
    // Revoke API keys created in this test
    for (const keyId of apiKeyIds) {
      try {
        await revokeApiKey(testUserId, keyId);
      } catch (error) {
        console.warn(`Failed to revoke key ${keyId}:`, error);
      }
    }
    apiKeyIds = [];
  });

  afterAll(async () => {
    // Cleanup all keys for this user
    await cleanupUserApiKeys(testUserId);
    await cleanupTestDatabase();
  });

  describe("GET /api/analytics/linear/issues", () => {
    it("should return issues with valid API key", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/issues?limit=10"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await issuesGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should handle teamId filter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/issues?teamId=team_123"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await issuesGET(request);

      expect(response.status).toBe(200);
    });

    it("should handle search query", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/issues?search=bug"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await issuesGET(request);

      expect(response.status).toBe(200);
    });

    it("should reject unauthenticated request", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/issues"
      );

      const response = await issuesGET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/analytics/linear/projects", () => {
    it("should return projects", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/projects"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await projectsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });

  describe("GET /api/analytics/linear/initiatives", () => {
    it("should return initiatives", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/initiatives"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await initiativesGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });

  describe("GET /api/analytics/linear/users", () => {
    it("should return Linear users", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/linear/users"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await usersGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });
});
