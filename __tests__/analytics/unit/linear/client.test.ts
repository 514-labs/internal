/**
 * Unit tests for Linear client
 */

import {
  LinearAnalyticsClient,
  getLinearClient,
  resetLinearClient,
} from "@/lib/analytics/linear/client";
import { ConfigurationError } from "@/lib/analytics/shared/errors";

jest.mock("@linear/sdk");
jest.mock("@/lib/integrations/linear-oauth");

describe("Linear Client", () => {
  beforeEach(() => {
    // Reset mocks and client cache before each test
    jest.clearAllMocks();
    resetLinearClient();
  });
  describe("Initialization", () => {
    it("should initialize LinearAnalyticsClient", () => {
      const client = new LinearAnalyticsClient();

      expect(client).toBeDefined();
      expect(client.getName()).toBe("Linear");
    });
  });

  describe("getLinearClient", () => {
    it("should return Linear client with OAuth token", async () => {
      // Mock OAuth token retrieval
      const {
        getValidLinearToken,
      } = require("@/lib/integrations/linear-oauth");
      getValidLinearToken.mockResolvedValue("oauth_token_123");

      const linearClient = await getLinearClient();

      expect(linearClient).toBeDefined();
      expect(getValidLinearToken).toHaveBeenCalled();
    });

    it("should fallback to API key when OAuth not available", async () => {
      // Mock OAuth token retrieval returning null
      const {
        getValidLinearToken,
      } = require("@/lib/integrations/linear-oauth");
      getValidLinearToken.mockResolvedValue(null);

      process.env.LINEAR_API_KEY = "test_api_key";

      const linearClient = await getLinearClient();

      expect(linearClient).toBeDefined();
    });

    it("should throw ConfigurationError when neither OAuth nor API key available", async () => {
      // Mock OAuth token retrieval returning null
      const {
        getValidLinearToken,
      } = require("@/lib/integrations/linear-oauth");
      getValidLinearToken.mockResolvedValue(null);

      delete process.env.LINEAR_API_KEY;

      await expect(getLinearClient()).rejects.toThrow(ConfigurationError);
    });
  });

  describe("healthCheck", () => {
    it("should return true when connected", async () => {
      const {
        getValidLinearToken,
      } = require("@/lib/integrations/linear-oauth");
      getValidLinearToken.mockResolvedValue("oauth_token_123");

      const client = new LinearAnalyticsClient();
      const health = await client.healthCheck();

      expect(health).toBe(true);
    });
  });

  describe("getClient", () => {
    it("should return Linear client instance", async () => {
      const {
        getValidLinearToken,
      } = require("@/lib/integrations/linear-oauth");
      getValidLinearToken.mockResolvedValue("oauth_token_123");

      const client = new LinearAnalyticsClient();
      const linearClient = await client.getClient();

      expect(linearClient).toBeDefined();
    });
  });
});
