/**
 * Integration tests for Rippling API routes
 *
 * ⚠️ REQUIRES REAL API KEYS
 * These tests call actual Rippling APIs. Set these environment variables:
 * - RIPPLING_API_KEY (not test_rippling_key)
 * - RIPPLING_API_URL (or use default https://api.rippling.com)
 */

import { GET as companyGET } from "@/app/api/analytics/rippling/company/route";
import { GET as employeesGET } from "@/app/api/analytics/rippling/employees/route";
import { NextRequest } from "next/server";
import { generateApiKey, listApiKeys, revokeApiKey } from "@/lib/auth/api-keys";
import { isServiceConfigured } from "../../../setup/test-config-validator";
import {
  setupTestDatabase,
  cleanupTestDatabase,
  cleanupUserApiKeys,
} from "../../../setup/test-helpers";

jest.mock("@supabase/supabase-js");

describe("Rippling API Routes", () => {
  let testApiKey: string;
  const testUserId = "test_user_rippling_" + Date.now();
  let apiKeyIds: string[] = [];
  let originalFetch: typeof global.fetch;

  beforeAll(async () => {
    // Setup database
    await setupTestDatabase();

    originalFetch = global.fetch;

    // Check if Rippling is configured with real API key
    if (!isServiceConfigured("Rippling")) {
      console.warn(
        "\n⚠️  Rippling integration tests will use MOCKS because real API key is not configured.\n" +
          "To test against real Rippling API, set in .env.local:\n" +
          "  RIPPLING_API_KEY=your_real_key\n" +
          "  RIPPLING_API_URL=https://api.rippling.com\n"
      );
    }

    // Mock Rippling API responses
    global.fetch = jest.fn().mockImplementation((url: string) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      if (urlStr.includes("/company")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              id: "company_123",
              name: "Test Corp",
              legalName: "Test Corporation Inc",
            },
          }),
        });
      }

      if (urlStr.includes("/employees")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              {
                id: "emp_1",
                firstName: "John",
                lastName: "Doe",
                email: "john@example.com",
                status: "ACTIVE",
              },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        text: async () => "Not found",
      });
    });
  });

  beforeEach(async () => {
    // Create fresh API key for each test
    testApiKey = await generateApiKey(testUserId, "Rippling Test Key");

    // Track key for cleanup
    const keys = await listApiKeys(testUserId);
    const newKey = keys.find((k) => k.key_name === "Rippling Test Key");
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
    global.fetch = originalFetch;
  });

  describe("GET /api/analytics/rippling/company", () => {
    it("should return company details with valid API key", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/rippling/company"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await companyGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe("company_123");
    });

    it("should reject unauthenticated request", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/rippling/company"
      );

      const response = await companyGET(request);

      expect(response.status).toBe(401);
    });
  });

  describe("GET /api/analytics/rippling/employees", () => {
    it("should return employees list", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/rippling/employees"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await employeesGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it("should handle query parameters", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/rippling/employees?status=ACTIVE&limit=50"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await employeesGET(request);

      expect(response.status).toBe(200);
    });

    it("should fetch specific employee by id", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/analytics/rippling/employees?id=emp_123"
      );
      request.headers.set("Authorization", `Bearer ${testApiKey}`);

      const response = await employeesGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toBeDefined();
    });
  });
});
