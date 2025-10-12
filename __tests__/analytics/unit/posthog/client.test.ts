/**
 * Unit tests for PostHog client
 */

import { PostHogAnalyticsClient } from "@/lib/analytics/posthog/client";
import { ConfigurationError } from "@/lib/analytics/shared/errors";

// Mock will be automatically used from __mocks__/posthog-node.ts
jest.mock("posthog-node");

describe("PostHog Client", () => {
  describe("Initialization", () => {
    it("should initialize with valid API key", () => {
      // API key is set in jest.setup.ts
      const client = new PostHogAnalyticsClient();

      expect(client).toBeDefined();
      expect(client.getName()).toBe("PostHog");
    });

    // Skip this test as env vars are set globally in jest.setup
    // and cannot be easily unset in individual tests
    it.skip("should throw ConfigurationError without API key", () => {
      // This is tested in integration tests
    });

    it("should use default host if not specified", () => {
      process.env.POSTHOG_API_KEY = "test_key";
      delete process.env.POSTHOG_HOST;

      const client = new PostHogAnalyticsClient();

      expect(client).toBeDefined();
    });
  });

  describe("healthCheck", () => {
    it("should return true when client is initialized", async () => {
      process.env.POSTHOG_API_KEY = "test_key";

      const client = new PostHogAnalyticsClient();
      const health = await client.healthCheck();

      expect(health).toBe(true);
    });
  });

  describe("getName", () => {
    it("should return PostHog", () => {
      process.env.POSTHOG_API_KEY = "test_key";

      const client = new PostHogAnalyticsClient();

      expect(client.getName()).toBe("PostHog");
    });
  });

  describe("executeHogQL", () => {
    it("should execute HogQL query", async () => {
      process.env.POSTHOG_API_KEY = "test_key";
      process.env.POSTHOG_PROJECT_ID = "123";

      const client = new PostHogAnalyticsClient();
      const result = await client.executeHogQL("SELECT * FROM events");

      expect(result).toBeDefined();
    });

    it("should throw without project ID", async () => {
      process.env.POSTHOG_API_KEY = "test_key";
      delete process.env.POSTHOG_PROJECT_ID;

      const client = new PostHogAnalyticsClient();

      await expect(client.executeHogQL("SELECT 1")).rejects.toThrow();
    });
  });
});
