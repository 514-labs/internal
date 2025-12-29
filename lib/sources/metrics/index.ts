/**
 * Metrics fetching layer
 *
 * Metrics are derived from entities. This layer provides functions
 * for fetching computed metrics from various sources.
 */

import { fetchPostHogMetric } from "./posthog";
import { fetchMercuryMetric } from "./mercury";
import { fetchAggregatedMetric } from "./aggregated";
import type { MetricSource } from "./types";

/**
 * Unified metric fetcher
 *
 * Fetches a metric value based on the metric source configuration.
 * Uses the appropriate connector and computation method.
 *
 * @param metric - Metric source configuration from goal key result
 * @param userId - User ID for sources that require authentication
 * @returns The computed metric value
 */
export async function fetchMetric(
  metric: MetricSource,
  userId?: string
): Promise<number> {
  switch (metric.source) {
    case "posthog":
      return fetchPostHogMetric(metric.type, metric.config);

    case "mercury":
      if (!userId) {
        throw new Error("userId is required for Mercury metrics");
      }
      return fetchMercuryMetric(userId, metric.type, metric.config);

    case "linear":
      return fetchAggregatedMetric("linear", metric.type, metric.config);

    case "hubspot":
      return fetchAggregatedMetric("hubspot", metric.type, metric.config);

    case "manual":
      // Manual metrics should use the frontmatter value
      return 0;

    default:
      throw new Error(`Unknown metric source: ${(metric as { source: string }).source}`);
  }
}

// Re-export individual metric fetchers
export { fetchPostHogMetric } from "./posthog";
export { fetchMercuryMetric } from "./mercury";
export { fetchAggregatedMetric, fetchLinearAggregatedMetric, fetchHubSpotAggregatedMetric } from "./aggregated";

// Type exports
export * from "./types";

