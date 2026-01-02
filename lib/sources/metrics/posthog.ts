/**
 * PostHog metric fetching
 *
 * PostHog metrics are derived from entities (events, persons) but can also
 * use pre-computed insights for efficiency.
 */

import { posthogAnalyticsClient } from "../connectors/posthog/client";
import type { PostHogMetricType } from "./types";

/**
 * PostHog metric configuration
 */
interface PostHogMetricConfig {
  eventName?: string;
  journeyId?: string;
  product?: "boreal" | "moosestack";
}

/**
 * Fetch DAU (Daily Active Users)
 */
async function fetchDAU(config?: PostHogMetricConfig): Promise<number> {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || "https://app.posthog.com";

  if (!projectId || !apiKey) {
    console.warn("PostHog not configured, returning 0 for DAU");
    return 0;
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let query = `
    SELECT COUNT(DISTINCT person_id) as dau
    FROM events
    WHERE timestamp >= '${yesterday.toISOString().split("T")[0]}'
  `;

  if (config?.product) {
    query += ` AND properties.$host LIKE '%${config.product}%'`;
  }

  try {
    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: [[number]] };
    return data.results?.[0]?.[0] || 0;
  } catch {
    console.error("Error fetching DAU from PostHog");
    return 0;
  }
}

/**
 * Fetch MAU (Monthly Active Users)
 */
async function fetchMAU(config?: PostHogMetricConfig): Promise<number> {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiKey = process.env.POSTHOG_API_KEY;

  if (!projectId || !apiKey) {
    console.warn("PostHog not configured, returning 0 for MAU");
    return 0;
  }

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let query = `
    SELECT COUNT(DISTINCT person_id) as mau
    FROM events
    WHERE timestamp >= '${thirtyDaysAgo.toISOString().split("T")[0]}'
  `;

  if (config?.product) {
    query += ` AND properties.$host LIKE '%${config.product}%'`;
  }

  try {
    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: [[number]] };
    return data.results?.[0]?.[0] || 0;
  } catch {
    console.error("Error fetching MAU from PostHog");
    return 0;
  }
}

/**
 * Fetch event count
 */
async function fetchEventCount(config?: PostHogMetricConfig): Promise<number> {
  if (!config?.eventName) {
    return 0;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const query = `
    SELECT COUNT(*) as count
    FROM events
    WHERE event = '${config.eventName}'
    AND timestamp >= '${thirtyDaysAgo.toISOString().split("T")[0]}'
  `;

  try {
    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: [[number]] };
    return data.results?.[0]?.[0] || 0;
  } catch {
    console.error("Error fetching event count from PostHog");
    return 0;
  }
}

/**
 * Fetch journey completion rate
 */
async function fetchJourneyCompletion(config?: PostHogMetricConfig): Promise<number> {
  if (!config?.journeyId) {
    return 0;
  }

  // This would query the journeys API for completion rate
  // For now, return a placeholder
  console.warn("Journey completion requires journeys API implementation");
  return 0;
}

/**
 * Fetch PostHog metric
 */
export async function fetchPostHogMetric(
  type: PostHogMetricType,
  config?: PostHogMetricConfig
): Promise<number> {
  switch (type) {
    case "dau":
      return fetchDAU(config);
    case "mau":
      return fetchMAU(config);
    case "events":
      return fetchEventCount(config);
    case "journeyCompletion":
      return fetchJourneyCompletion(config);
    case "conversions":
      // Would use funnel/conversion tracking
      return 0;
    default:
      throw new Error(`Unknown PostHog metric type: ${type}`);
  }
}


