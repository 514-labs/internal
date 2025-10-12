/**
 * Unit tests for Rippling client
 */

import { RipplingAnalyticsClient } from "@/lib/analytics/rippling/client";
import { ConfigurationError } from "@/lib/analytics/shared/errors";

describe("Rippling Client", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalEnv = { ...process.env };
    originalFetch = global.fetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  describe("Initialization", () => {
    it("should initialize with valid API key", () => {
      process.env.RIPPLING_API_KEY = "test_key";

      const client = new RipplingAnalyticsClient();

      expect(client).toBeDefined();
      expect(client.getName()).toBe("Rippling");
    });

    it("should throw ConfigurationError without API key", () => {
      delete process.env.RIPPLING_API_KEY;

      expect(() => new RipplingAnalyticsClient()).toThrow(ConfigurationError);
    });

    it("should use default URL if not specified", () => {
      process.env.RIPPLING_API_KEY = "test_key";
      delete process.env.RIPPLING_API_URL;

      const client = new RipplingAnalyticsClient();

      expect(client).toBeDefined();
    });
  });

  describe("healthCheck", () => {
    it("should return true when API is accessible", async () => {
      process.env.RIPPLING_API_KEY = "test_key";

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
      });

      const client = new RipplingAnalyticsClient();
      const health = await client.healthCheck();

      expect(health).toBe(true);
    });

    it("should return false on error", async () => {
      process.env.RIPPLING_API_KEY = "test_key";

      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

      const client = new RipplingAnalyticsClient();
      const health = await client.healthCheck();

      expect(health).toBe(false);
    });
  });

  describe("fetch", () => {
    it("should include Authorization header", async () => {
      process.env.RIPPLING_API_KEY = "test_api_key";

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: {} }),
      });
      global.fetch = mockFetch;

      const client = new RipplingAnalyticsClient();
      await client.fetch("/test");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test_api_key",
          }),
        })
      );
    });
  });

  describe("get", () => {
    it("should make GET request and parse JSON", async () => {
      process.env.RIPPLING_API_KEY = "test_key";

      const mockData = { data: { test: "value" } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const client = new RipplingAnalyticsClient();
      const result = await client.get("/test");

      expect(result).toEqual(mockData);
    });

    it("should throw on API error", async () => {
      process.env.RIPPLING_API_KEY = "test_key";

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server error",
      });

      const client = new RipplingAnalyticsClient();

      await expect(client.get("/test")).rejects.toThrow();
    });
  });
});
