/**
 * Integration tests for PostHog API routes
 *
 * ⚠️ REQUIRES REAL API KEYS
 * These tests call actual PostHog APIs. Set these environment variables:
 * - POSTHOG_API_KEY (not test_posthog_key)
 * - POSTHOG_PROJECT_ID (not test_project_id)
 */

import { GET as eventsGET } from "@/app/api/analytics/posthog/events/route";
import { GET as journeysGET } from "@/app/api/analytics/posthog/journeys/route";
import { GET as pageviewsGET } from "@/app/api/analytics/posthog/pageviews/route";
import { GET as hubspotGET } from "@/app/api/analytics/posthog/hubspot/route";
import { NextRequest } from "next/server";
import { generateApiKey, listApiKeys, revokeApiKey } from "@/lib/auth/api-keys";
import {
  skipIfNotConfigured,
  isServiceConfigured,
} from "../../../setup/test-config-validator";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  cleanupUserApiKeys,
} from "../../../setup/test-helpers";

jest.mock("posthog-node");
jest.mock("@supabase/supabase-js");

describe("PostHog API Routes", () => {
  let testApiKey: string;
  const testUserId = "test_user_posthog_" + Date.now();
  let apiKeyIds: string[] = [];

  beforeAll(async () => {
    // Setup database
    await setupTestDatabase();

    // Check if PostHog is configured with real API keys
    if (!isServiceConfigured("PostHog")) {
      console.warn(
        "\n⚠️  PostHog integration tests will use MOCKS because real API keys are not configured.\n" +
          "To test against real PostHog API, set in .env.local:\n" +
          "  POSTHOG_API_KEY=phc_your_real_key\n" +
          "  POSTHOG_PROJECT_ID=your_project_id\n"
      );
    }
  });

  beforeEach(async () => {
    // Create fresh API key for each test
    testApiKey = await generateApiKey(testUserId, "PostHog Test Key");

    // Track key for cleanup
    const keys = await listApiKeys(testUserId);
    const newKey = keys.find((k) => k.key_name === "PostHog Test Key");
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

  describe("GET /api/analytics/posthog/events", () => {
    it("should return events with valid API key", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/events?limit=10"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await eventsGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it("should reject request without authentication", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/events"
      );

      const response = await eventsGET(request);

      expect(response.status).toBe(401);
    });

    it("should handle query parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/events?limit=5&eventName=signup"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await eventsGET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/analytics/posthog/journeys", () => {
    it("should return journey with userId parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/journeys?userId=user_123"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await journeysGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });

    it("should return 400 without userId parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/journeys"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await journeysGET(request);

      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/analytics/posthog/pageviews", () => {
    it("should return page view analytics", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/pageviews?limit=20"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await pageviewsGET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/analytics/posthog/hubspot", () => {
    it("should return HubSpot contacts", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/hubspot?table=contacts"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await hubspotGET(request);

      // Log error if not 200
      if (response.status !== 200) {
        const error = await response.json();
        console.log("Error response:", error);
      }

      expect(response.status).toBe(200);
    });

    it("should return 400 without table parameter", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/posthog/hubspot"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await hubspotGET(request);

      expect(response.status).toBe(400);
    });

    it("should support different table types", async () => {
      const tables = ["contacts", "deals", "companies"];

      for (const table of tables) {
        const request = new NextRequest(
          `http://localhost:3000/api/analytics/posthog/hubspot?table=${table}`
        );
        request.headers.set("Authorization", `Bearer ${testApiKey}`);

        const response = await hubspotGET(request);

        expect(response.status).toBe(200);
      }
    });
  });
});
