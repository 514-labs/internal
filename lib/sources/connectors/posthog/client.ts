/**
 * PostHog connector client
 * Re-exports from the existing analytics implementation for backwards compatibility
 */

export {
  getPostHogClient,
  PostHogAnalyticsClient,
  posthogAnalyticsClient,
} from "@/lib/analytics/posthog/client";

