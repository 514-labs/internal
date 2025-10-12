/**
 * Custom error classes for analytics integrations
 */

/**
 * Base analytics error class
 */
export class AnalyticsError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "ANALYTICS_ERROR",
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

/**
 * Validation error for invalid input data
 */
export class ValidationError extends AnalyticsError {
  constructor(message: string, details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

/**
 * Authentication error for invalid or missing credentials
 */
export class AuthenticationError extends AnalyticsError {
  constructor(message: string, details?: unknown) {
    super(message, 401, "AUTHENTICATION_ERROR", details);
  }
}

/**
 * Authorization error for insufficient permissions
 */
export class AuthorizationError extends AnalyticsError {
  constructor(message: string, details?: unknown) {
    super(message, 403, "AUTHORIZATION_ERROR", details);
  }
}

/**
 * Rate limit error when API rate limits are exceeded
 */
export class RateLimitError extends AnalyticsError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_ERROR", { retryAfter });
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AnalyticsError {
  constructor(message: string, details?: unknown) {
    super(message, 404, "NOT_FOUND_ERROR", details);
  }
}

/**
 * External API error for issues with third-party services
 */
export class ExternalAPIError extends AnalyticsError {
  constructor(
    service: string,
    message: string,
    statusCode: number = 502,
    details?: unknown
  ) {
    super(
      `${service} API Error: ${message}`,
      statusCode,
      "EXTERNAL_API_ERROR",
      details
        ? { service, ...(typeof details === "object" ? details : {}) }
        : { service }
    );
  }
}

/**
 * Configuration error for missing or invalid configuration
 */
export class ConfigurationError extends AnalyticsError {
  constructor(message: string, details?: unknown) {
    super(message, 500, "CONFIGURATION_ERROR", details);
  }
}
