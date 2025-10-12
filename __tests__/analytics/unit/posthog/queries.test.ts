/**
 * Unit tests for PostHog query functions
 */

import {
  getEvents,
  getPageViews,
  getJourneys,
  getActivations,
  getHubspotContacts,
} from "@/lib/analytics/posthog/queries";
import { ExternalAPIError } from "@/lib/analytics/shared/errors";

jest.mock("posthog-node");

describe("PostHog Queries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getEvents", () => {
    it("should fetch events with filters", async () => {
      const events = await getEvents({
        limit: 10,
        offset: 0,
        eventName: "test_event",
      });

      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
    });

    it("should handle API errors", async () => {
      // Mock fetch to fail
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          statusText: "Internal Server Error",
        })
      );

      await expect(getEvents({ limit: 10, offset: 0 })).rejects.toThrow(
        ExternalAPIError
      );
    });
  });

  describe("getPageViews", () => {
    it("should aggregate page views", async () => {
      const pageViews = await getPageViews({
        limit: 50,
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
      });

      expect(pageViews).toBeDefined();
      expect(Array.isArray(pageViews)).toBe(true);
    });
  });

  describe("getJourneys", () => {
    it("should fetch user journey", async () => {
      const journey = await getJourneys("user_123");

      expect(journey).toBeDefined();
      expect(journey.distinct_id).toBe("user_123");
      expect(Array.isArray(journey.steps)).toBe(true);
    });

    it("should return empty journey for user with no events", async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ results: [] }),
        })
      );

      const journey = await getJourneys("user_no_events");

      expect(journey.steps).toHaveLength(0);
    });
  });

  describe("getActivations", () => {
    it("should fetch activation metrics", async () => {
      const activations = await getActivations({ limit: 100 });

      expect(activations).toBeDefined();
      expect(Array.isArray(activations)).toBe(true);
    });
  });

  describe("getHubspotContacts", () => {
    it("should fetch HubSpot contacts from data warehouse", async () => {
      const contacts = await getHubspotContacts({
        limit: 50,
        sortOrder: "desc",
      });

      expect(contacts).toBeDefined();
      expect(Array.isArray(contacts)).toBe(true);
    });
  });
});
