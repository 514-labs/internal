/**
 * Custom error classes for source connectors
 * Re-exports from the original analytics shared errors for backwards compatibility
 */

export {
  AnalyticsError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  NotFoundError,
  ExternalAPIError,
  ConfigurationError,
} from "@/lib/analytics/shared/errors";

