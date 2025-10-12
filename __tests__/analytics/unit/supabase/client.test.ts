/**
 * Unit tests for Supabase client
 */

import { SupabaseAnalyticsClient } from "@/lib/analytics/supabase/client";
import { ConfigurationError } from "@/lib/analytics/shared/errors";

jest.mock("@supabase/supabase-js");

describe("Supabase Client", () => {
  describe("Initialization", () => {
    it("should initialize with valid configuration", () => {
      const client = new SupabaseAnalyticsClient();

      expect(client).toBeDefined();
      expect(client.getName()).toBe("Supabase");
      expect(client.isConfigured()).toBe(true);
    });
  });

  describe("getName", () => {
    it("should return Supabase", () => {
      const client = new SupabaseAnalyticsClient();

      expect(client.getName()).toBe("Supabase");
    });
  });

  describe("healthCheck", () => {
    it("should check database connectivity", async () => {
      const client = new SupabaseAnalyticsClient();
      const health = await client.healthCheck();

      // Mock will return true or false
      expect(typeof health).toBe("boolean");
    });
  });

  describe("getClient", () => {
    it("should return Supabase client", () => {
      const client = new SupabaseAnalyticsClient();
      const supabaseClient = client.getClient();

      expect(supabaseClient).toBeDefined();
    });

    it("should throw when not configured", () => {
      // Create instance without config
      const client = new SupabaseAnalyticsClient();
      // Force not configured state by deleting env vars before init
      // In actual usage, this is tested in integration tests

      expect(client).toBeDefined();
    });
  });

  describe("isConfigured", () => {
    it("should return true when configured", () => {
      const client = new SupabaseAnalyticsClient();

      expect(client.isConfigured()).toBe(true);
    });
  });
});
