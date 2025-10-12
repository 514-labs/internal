/**
 * Unit tests for custom error classes
 */

import {
  AnalyticsError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  NotFoundError,
  ExternalAPIError,
  ConfigurationError,
} from "@/lib/analytics/shared/errors";

describe("Analytics Errors", () => {
  describe("AnalyticsError", () => {
    it("should create error with default values", () => {
      const error = new AnalyticsError("Test error");

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("ANALYTICS_ERROR");
      expect(error.name).toBe("AnalyticsError");
    });

    it("should create error with custom values", () => {
      const error = new AnalyticsError("Custom error", 418, "CUSTOM_CODE", {
        extra: "data",
      });

      expect(error.statusCode).toBe(418);
      expect(error.code).toBe("CUSTOM_CODE");
      expect(error.details).toEqual({ extra: "data" });
    });

    it("should serialize to JSON correctly", () => {
      const error = new AnalyticsError("Test", 500, "TEST_CODE", {
        detail: "info",
      });

      const json = error.toJSON();

      expect(json).toEqual({
        name: "AnalyticsError",
        message: "Test",
        code: "TEST_CODE",
        statusCode: 500,
        details: { detail: "info" },
      });
    });
  });

  describe("ValidationError", () => {
    it("should create validation error with 400 status", () => {
      const error = new ValidationError("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Invalid input");
    });

    it("should include details", () => {
      const details = { field: "email", issue: "invalid format" };
      const error = new ValidationError("Invalid email", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("AuthenticationError", () => {
    it("should create auth error with 401 status", () => {
      const error = new AuthenticationError("Invalid credentials");

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("AUTHENTICATION_ERROR");
    });
  });

  describe("AuthorizationError", () => {
    it("should create authz error with 403 status", () => {
      const error = new AuthorizationError("Forbidden");

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("AUTHORIZATION_ERROR");
    });
  });

  describe("RateLimitError", () => {
    it("should create rate limit error with 429 status", () => {
      const error = new RateLimitError("Too many requests", 60);

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe("RATE_LIMIT_ERROR");
      expect(error.details).toEqual({ retryAfter: 60 });
    });
  });

  describe("NotFoundError", () => {
    it("should create not found error with 404 status", () => {
      const error = new NotFoundError("Resource not found");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND_ERROR");
    });
  });

  describe("ExternalAPIError", () => {
    it("should create external API error with service name", () => {
      const error = new ExternalAPIError("PostHog", "API timeout");

      expect(error.statusCode).toBe(502);
      expect(error.code).toBe("EXTERNAL_API_ERROR");
      expect(error.message).toContain("PostHog");
      expect(error.message).toContain("API timeout");
    });

    it("should include service in details", () => {
      const error = new ExternalAPIError("Linear", "Connection failed", 503);

      expect(error.statusCode).toBe(503);
      expect(error.details).toMatchObject({ service: "Linear" });
    });
  });

  describe("ConfigurationError", () => {
    it("should create configuration error with 500 status", () => {
      const error = new ConfigurationError("Missing API key");

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("CONFIGURATION_ERROR");
    });
  });
});
