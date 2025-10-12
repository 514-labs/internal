/**
 * PostHog query functions
 */

import { posthogAnalyticsClient } from "./client";
import type { QueryOptions } from "../shared/types";
import { ExternalAPIError, ValidationError } from "../shared/errors";
import type {
  Event,
  EventQueryOptions,
  PageViewAggregate,
  Journey,
  Activation,
  HubspotContact,
  HubspotDeal,
  HubspotCompany,
  HogQLQueryResult,
} from "./schemas";

/**
 * Get events from PostHog
 */
export async function getEvents(options: EventQueryOptions): Promise<Event[]> {
  try {
    const client = posthogAnalyticsClient.getClient();

    // Note: posthog-node is primarily for sending events
    // To fetch events, we need to use the PostHog API directly
    const projectId = process.env.POSTHOG_PROJECT_ID;
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || "https://app.posthog.com";

    if (!projectId) {
      throw new ValidationError("PostHog project ID is required");
    }

    // Build query parameters
    const params = new URLSearchParams({
      limit: String(options.limit || 100),
      offset: String(options.offset || 0),
    });

    if (options.eventName) {
      params.append("event", options.eventName);
    }

    const response = await fetch(
      `${host}/api/projects/${projectId}/events/?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new ExternalAPIError(
        "PostHog",
        `Failed to fetch events: ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    if (error instanceof ExternalAPIError) {
      throw error;
    }
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching events: ${(error as Error).message}`
    );
  }
}

/**
 * Get page views aggregated by pathname
 */
export async function getPageViews(
  options: QueryOptions
): Promise<PageViewAggregate[]> {
  try {
    // Build HogQL query for page views
    const query = `
      SELECT 
        properties.$current_url as pathname,
        count() as views,
        count(DISTINCT distinct_id) as unique_visitors,
        avg(properties.$session_duration) as avg_duration
      FROM events
      WHERE event = '$pageview'
        ${options.startDate ? `AND timestamp >= '${options.startDate}'` : ""}
        ${options.endDate ? `AND timestamp <= '${options.endDate}'` : ""}
      GROUP BY pathname
      ORDER BY views DESC
      LIMIT ${options.limit || 100}
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results) {
      return [];
    }

    // Transform results to PageViewAggregate
    return data.results.map((row: unknown[]) => ({
      pathname: String(row[0]),
      views: Number(row[1]),
      unique_visitors: Number(row[2]),
      avg_duration: row[3] ? Number(row[3]) : undefined,
    }));
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching page views: ${(error as Error).message}`
    );
  }
}

/**
 * Get user journey for a specific user
 */
export async function getJourneys(
  userId: string,
  options?: QueryOptions
): Promise<Journey> {
  try {
    const query = `
      SELECT 
        event,
        timestamp,
        properties
      FROM events
      WHERE distinct_id = '${userId}'
        ${options?.startDate ? `AND timestamp >= '${options.startDate}'` : ""}
        ${options?.endDate ? `AND timestamp <= '${options.endDate}'` : ""}
      ORDER BY timestamp ASC
      LIMIT ${options?.limit || 1000}
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results || data.results.length === 0) {
      return {
        distinct_id: userId,
        steps: [],
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      };
    }

    const steps = data.results.map((row: unknown[]) => ({
      event: String(row[0]),
      timestamp: String(row[1]),
      properties: row[2] as Record<string, unknown>,
    }));

    return {
      distinct_id: userId,
      steps,
      start_time: steps[0].timestamp,
      end_time: steps[steps.length - 1].timestamp,
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching journey: ${(error as Error).message}`
    );
  }
}

/**
 * Get activation metrics
 */
export async function getActivations(
  options: QueryOptions
): Promise<Activation[]> {
  try {
    // Define activation criteria (customize based on your needs)
    // This is a placeholder implementation
    const query = `
      SELECT 
        distinct_id,
        min(timestamp) as activation_date,
        count(DISTINCT event) as event_count
      FROM events
      WHERE event IN ('signup_completed', 'first_action', 'onboarding_completed')
        ${options.startDate ? `AND timestamp >= '${options.startDate}'` : ""}
        ${options.endDate ? `AND timestamp <= '${options.endDate}'` : ""}
      GROUP BY distinct_id
      LIMIT ${options.limit || 100}
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results) {
      return [];
    }

    return data.results.map((row: unknown[]) => ({
      distinct_id: String(row[0]),
      activated: true,
      activation_date: String(row[1]),
      days_to_activate: undefined,
      activation_events: undefined,
    }));
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching activations: ${(error as Error).message}`
    );
  }
}

/**
 * Query HubSpot data from PostHog data warehouse
 */
export async function queryHubspotData<T = unknown>(
  table: string,
  options: QueryOptions
): Promise<T[]> {
  try {
    const query = `
      SELECT *
      FROM ${table}
      ${options.startDate ? `WHERE created_at >= '${options.startDate}'` : ""}
      ${
        options.endDate
          ? `${options.startDate ? "AND" : "WHERE"} created_at <= '${
              options.endDate
            }'`
          : ""
      }
      ORDER BY ${options.sortBy || "created_at"} ${options.sortOrder || "DESC"}
      LIMIT ${options.limit || 100}
      OFFSET ${options.offset || 0}
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    return (data.results || []) as T[];
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error querying HubSpot data: ${(error as Error).message}`
    );
  }
}

/**
 * Get HubSpot contacts from PostHog data warehouse
 */
export async function getHubspotContacts(
  options: QueryOptions
): Promise<HubspotContact[]> {
  return queryHubspotData<HubspotContact>("hubspot_contacts", options);
}

/**
 * Get HubSpot deals from PostHog data warehouse
 */
export async function getHubspotDeals(
  options: QueryOptions
): Promise<HubspotDeal[]> {
  return queryHubspotData<HubspotDeal>("hubspot_deals", options);
}

/**
 * Get HubSpot companies from PostHog data warehouse
 */
export async function getHubspotCompanies(
  options: QueryOptions
): Promise<HubspotCompany[]> {
  return queryHubspotData<HubspotCompany>("hubspot_companies", options);
}
