/**
 * Unit tests for PostHog schemas
 */

import {
  EventSchema,
  EventQueryOptionsSchema,
  PageViewSchema,
  JourneySchema,
  ActivationSchema,
  HubspotContactSchema,
  HubspotDealSchema,
  HubspotCompanySchema,
} from "@/lib/analytics/posthog/schemas";

describe("PostHog Schemas", () => {
  describe("EventSchema", () => {
    it("should validate valid event", () => {
      const validEvent = {
        event: "test_event",
        distinct_id: "user_123",
        properties: { page: "/home" },
        timestamp: "2024-01-01T00:00:00Z",
        uuid: "uuid-123",
      };

      const result = EventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it("should validate event with minimal fields", () => {
      const minimalEvent = {
        event: "click",
        distinct_id: "user_456",
      };

      const result = EventSchema.safeParse(minimalEvent);
      expect(result.success).toBe(true);
    });

    it("should reject event without required fields", () => {
      const invalidEvent = {
        event: "test",
      };

      const result = EventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe("EventQueryOptionsSchema", () => {
    it("should validate query options", () => {
      const options = {
        limit: 50,
        eventName: "signup",
        distinctId: "user_123",
      };

      const result = EventQueryOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = EventQueryOptionsSchema.parse({});

      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
    });
  });

  describe("PageViewSchema", () => {
    it("should validate page view", () => {
      const pageView = {
        pathname: "/dashboard",
        timestamp: "2024-01-01T00:00:00Z",
        distinct_id: "user_123",
        session_id: "session_456",
        duration: 30000,
      };

      const result = PageViewSchema.safeParse(pageView);
      expect(result.success).toBe(true);
    });
  });

  describe("JourneySchema", () => {
    it("should validate user journey", () => {
      const journey = {
        distinct_id: "user_123",
        steps: [
          {
            event: "page_view",
            timestamp: "2024-01-01T00:00:00Z",
          },
          {
            event: "button_click",
            timestamp: "2024-01-01T00:01:00Z",
            properties: { button: "signup" },
          },
        ],
        start_time: "2024-01-01T00:00:00Z",
        end_time: "2024-01-01T00:01:00Z",
      };

      const result = JourneySchema.safeParse(journey);
      expect(result.success).toBe(true);
    });
  });

  describe("ActivationSchema", () => {
    it("should validate activation data", () => {
      const activation = {
        distinct_id: "user_123",
        activated: true,
        activation_date: "2024-01-01T00:00:00Z",
        days_to_activate: 3,
      };

      const result = ActivationSchema.safeParse(activation);
      expect(result.success).toBe(true);
    });
  });

  describe("HubspotContactSchema", () => {
    it("should validate HubSpot contact", () => {
      const contact = {
        id: "contact_123",
        email: "test@example.com",
        firstname: "John",
        lastname: "Doe",
        company: "Test Corp",
        lifecyclestage: "customer",
      };

      const result = HubspotContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const contact = {
        id: "contact_123",
        email: "invalid-email",
      };

      const result = HubspotContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
    });
  });

  describe("HubspotDealSchema", () => {
    it("should validate HubSpot deal", () => {
      const deal = {
        id: "deal_123",
        dealname: "Big Deal",
        amount: 50000,
        dealstage: "closedwon",
        closedate: "2024-01-01T00:00:00Z",
      };

      const result = HubspotDealSchema.safeParse(deal);
      expect(result.success).toBe(true);
    });
  });

  describe("HubspotCompanySchema", () => {
    it("should validate HubSpot company", () => {
      const company = {
        id: "company_123",
        name: "Test Corp",
        domain: "testcorp.com",
        industry: "Technology",
        numberofemployees: 50,
      };

      const result = HubspotCompanySchema.safeParse(company);
      expect(result.success).toBe(true);
    });
  });
});
