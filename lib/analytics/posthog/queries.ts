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
  CumulativeOSSInstallMetrics,
  CumulativeProjectsMetrics,
  CumulativeDeploymentsMetrics,
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

/**
 * Format ISO date string to HogQL-compatible format
 */
function formatDateForHogQL(isoDate: string): string {
  // Convert ISO 8601 to HogQL format: YYYY-MM-DD HH:MM:SS
  const date = new Date(isoDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Get product metrics (DAU/MAU, conversion rates, engagement)
 */
export async function getProductMetrics(
  product: "boreal" | "moosestack",
  timeWindow: { startDate: string; endDate: string }
): Promise<{
  dau: number;
  mau: number;
  conversionRate: number;
  engagementScore: number;
  specificMetrics: Record<string, number>;
  chartData: Array<{ date: string; users: number }>;
  githubStars?: {
    current: number;
    chartData: Array<{ date: string; stars: number }>;
  };
}> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    // Calculate DAU (distinct users per day, averaged over the period)
    const dauQuery = `
      SELECT 
        toDate(timestamp) as date,
        count(DISTINCT distinct_id) as users
      FROM events
      WHERE timestamp >= '${startDate}'
        AND timestamp <= '${endDate}'
        AND (
          properties.product = '${product}'
          OR event LIKE '${product}_%'
        )
      GROUP BY date
      ORDER BY date DESC
    `;

    const dauResult = await posthogAnalyticsClient.executeHogQL(dauQuery);
    const dauData = dauResult as { results?: unknown[][] };
    const chartData = (dauData.results || []).map((row: unknown[]) => ({
      date: String(row[0]),
      users: Number(row[1]),
    }));

    const dau =
      chartData.length > 0
        ? chartData.reduce((sum, d) => sum + d.users, 0) / chartData.length
        : 0;

    // Calculate MAU (distinct users in last 30 days)
    const mauQuery = `
      SELECT count(DISTINCT distinct_id) as mau
      FROM events
      WHERE timestamp >= '${startDate}'
        AND timestamp <= '${endDate}'
        AND (
          properties.product = '${product}'
          OR event LIKE '${product}_%'
        )
    `;

    const mauResult = await posthogAnalyticsClient.executeHogQL(mauQuery);
    const mauData = mauResult as { results?: unknown[][] };
    const mau = mauData.results?.[0]?.[0] ? Number(mauData.results[0][0]) : 0;

    // Calculate engagement score (avg events per user)
    const engagementQuery = `
      SELECT 
        count(*) as total_events,
        count(DISTINCT distinct_id) as total_users
      FROM events
      WHERE timestamp >= '${startDate}'
        AND timestamp <= '${endDate}'
        AND (
          properties.product = '${product}'
          OR event LIKE '${product}_%'
        )
    `;

    const engagementResult = await posthogAnalyticsClient.executeHogQL(
      engagementQuery
    );
    const engagementData = engagementResult as { results?: unknown[][] };
    const totalEvents = engagementData.results?.[0]?.[0]
      ? Number(engagementData.results[0][0])
      : 0;
    const totalUsers = engagementData.results?.[0]?.[1]
      ? Number(engagementData.results[0][1])
      : 0;
    const engagementScore = totalUsers > 0 ? totalEvents / totalUsers : 0;

    // Calculate conversion rate (simplified - users who completed key event)
    // Split into two simpler queries to avoid HogQL CASE WHEN issues
    const convertedQuery = `
      SELECT count(DISTINCT distinct_id) as converted
      FROM events
      WHERE timestamp >= '${startDate}'
        AND timestamp <= '${endDate}'
        AND (event LIKE '${product}_production%' OR event LIKE '${product}_active%')
    `;

    const totalQuery = `
      SELECT count(DISTINCT distinct_id) as total
      FROM events
      WHERE timestamp >= '${startDate}'
        AND timestamp <= '${endDate}'
        AND (
          properties.product = '${product}'
          OR event LIKE '${product}_%'
        )
    `;

    const [convertedResult, totalResult] = await Promise.all([
      posthogAnalyticsClient.executeHogQL(convertedQuery),
      posthogAnalyticsClient.executeHogQL(totalQuery),
    ]);

    const convertedData = convertedResult as { results?: unknown[][] };
    const totalData = totalResult as { results?: unknown[][] };
    const converted = convertedData.results?.[0]?.[0]
      ? Number(convertedData.results[0][0])
      : 0;
    const total = totalData.results?.[0]?.[0]
      ? Number(totalData.results[0][0])
      : 0;
    const conversionRate = total > 0 ? (converted / total) * 100 : 0;

    // Product-specific metrics
    const specificMetrics: Record<string, number> = {};

    if (product === "boreal") {
      // Boreal-specific: deployment count, active projects
      const borealMetricsQuery = `
        SELECT 
          countIf(event = 'boreal_deployment') as deployments,
          count(DISTINCT properties.project_id) as active_projects
        FROM events
        WHERE timestamp >= '${startDate}'
          AND timestamp <= '${endDate}'
          AND event LIKE 'boreal_%'
      `;

      const borealResult = await posthogAnalyticsClient.executeHogQL(
        borealMetricsQuery
      );
      const borealData = borealResult as { results?: unknown[][] };
      specificMetrics.deployments = borealData.results?.[0]?.[0]
        ? Number(borealData.results[0][0])
        : 0;
      specificMetrics.activeProjects = borealData.results?.[0]?.[1]
        ? Number(borealData.results[0][1])
        : 0;
    } else if (product === "moosestack") {
      // Moosestack-specific: installs, doc views, builds
      const moosestackMetricsQuery = `
        SELECT 
          countIf(event = 'moosestack_installed') as installs,
          countIf(event = 'moosestack_docs_read') as doc_views,
          countIf(event LIKE '%build%') as builds
        FROM events
        WHERE timestamp >= '${startDate}'
          AND timestamp <= '${endDate}'
          AND event LIKE 'moosestack_%'
      `;

      const moosestackResult = await posthogAnalyticsClient.executeHogQL(
        moosestackMetricsQuery
      );
      const moosestackData = moosestackResult as { results?: unknown[][] };
      specificMetrics.installs = moosestackData.results?.[0]?.[0]
        ? Number(moosestackData.results[0][0])
        : 0;
      specificMetrics.docViews = moosestackData.results?.[0]?.[1]
        ? Number(moosestackData.results[0][1])
        : 0;
      specificMetrics.builds = moosestackData.results?.[0]?.[2]
        ? Number(moosestackData.results[0][2])
        : 0;
    }

    // Fetch GitHub stars for moosestack
    let githubStars;
    if (product === "moosestack") {
      try {
        const starsData = await getGitHubStars(timeWindow);
        githubStars = {
          current: starsData.currentStars,
          chartData: starsData.chartData,
        };
      } catch (starsError) {
        console.error("Error fetching GitHub stars:", starsError);
        // GitHub stars is optional, don't fail the entire request
        githubStars = undefined;
      }
    }

    return {
      dau,
      mau,
      conversionRate,
      engagementScore,
      specificMetrics,
      chartData,
      githubStars,
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching product metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get journey metrics for a specific journey
 */
export async function getJourneyMetrics(
  journeyId: string,
  events: string[],
  timeWindow: { startDate: string; endDate: string }
): Promise<{
  totalStarted: number;
  totalCompleted: number;
  completionRate: number;
  steps: Array<{
    eventName: string;
    userCount: number;
    completionRate: number;
    dropOffRate: number;
  }>;
}> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    // Build funnel query for the journey
    const eventsList = events.map((e) => `'${e}'`).join(", ");

    // Get funnel data
    const funnelQuery = `
      SELECT 
        step,
        count(DISTINCT person_id) as user_count
      FROM (
        SELECT 
          distinct_id as person_id,
          arrayJoin(range(1, ${events.length + 1})) as step
        FROM events
        WHERE timestamp >= '${startDate}'
          AND timestamp <= '${endDate}'
          AND event IN (${eventsList})
        GROUP BY person_id
        HAVING step <= length(groupArray(event))
      )
      GROUP BY step
      ORDER BY step
    `;

    const funnelResult = await posthogAnalyticsClient.executeHogQL(funnelQuery);
    const funnelData = funnelResult as { results?: unknown[][] };

    // Process results
    const totalStarted = funnelData.results?.[0]?.[1]
      ? Number(funnelData.results[0][1])
      : 0;
    const totalCompleted = funnelData.results?.[events.length - 1]?.[1]
      ? Number(funnelData.results[events.length - 1][1])
      : 0;
    const completionRate =
      totalStarted > 0 ? (totalCompleted / totalStarted) * 100 : 0;

    // Calculate per-step metrics
    const steps = events.map((eventName, index) => {
      const userCount = funnelData.results?.[index]?.[1]
        ? Number(funnelData.results[index][1])
        : 0;
      const stepCompletionRate =
        totalStarted > 0 ? (userCount / totalStarted) * 100 : 0;
      const previousUserCount =
        index > 0 && funnelData.results?.[index - 1]?.[1]
          ? Number(funnelData.results[index - 1][1])
          : totalStarted;
      const dropOffRate =
        previousUserCount > 0
          ? ((previousUserCount - userCount) / previousUserCount) * 100
          : 0;

      return {
        eventName,
        userCount,
        completionRate: stepCompletionRate,
        dropOffRate,
      };
    });

    return {
      totalStarted,
      totalCompleted,
      completionRate,
      steps,
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching journey metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get overview metrics across all products
 */
export async function getOverviewMetrics(timeWindow: {
  startDate: string;
  endDate: string;
}): Promise<{
  totalUsers: number;
  totalActiveUsers: number;
  totalEvents: number;
  productsMetrics: {
    boreal: { dau: number; mau: number };
    moosestack: { dau: number; mau: number };
  };
}> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    // Get overall metrics
    const overallQuery = `
      SELECT 
        count(DISTINCT distinct_id) as total_users,
        count(*) as total_events
      FROM events
      WHERE timestamp >= '${startDate}'
        AND timestamp <= '${endDate}'
    `;

    const overallResult = await posthogAnalyticsClient.executeHogQL(
      overallQuery
    );
    const overallData = overallResult as { results?: unknown[][] };
    const totalUsers = overallData.results?.[0]?.[0]
      ? Number(overallData.results[0][0])
      : 0;
    const totalEvents = overallData.results?.[0]?.[1]
      ? Number(overallData.results[0][1])
      : 0;

    // Get active users (users with events in the period)
    const totalActiveUsers = totalUsers;

    // Get per-product metrics
    const borealMetrics = await getProductMetrics("boreal", timeWindow);
    const moosestackMetrics = await getProductMetrics("moosestack", timeWindow);

    return {
      totalUsers,
      totalActiveUsers,
      totalEvents,
      productsMetrics: {
        boreal: {
          dau: borealMetrics.dau,
          mau: borealMetrics.mau,
        },
        moosestack: {
          dau: moosestackMetrics.dau,
          mau: moosestackMetrics.mau,
        },
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching overview metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get cumulative OSS install metrics
 * Tracks fiveonefour_cli_install_script_run events over time
 * with breakdown by CLI name (moose, aurora, sloan)
 */
export async function getCumulativeOSSInstalls(
  timeWindow: { startDate: string; endDate: string },
  options?: {
    breakdownProperty?: string;
    products?: string[];
    excludeDevelopers?: boolean;
  }
): Promise<CumulativeOSSInstallMetrics> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    const breakdownProperty = options?.breakdownProperty || "cli_name";
    const products = options?.products || ["moose", "aurora", "sloan"];
    const excludeDevelopers = options?.excludeDevelopers !== false;

    // Build the main query for cumulative installs with breakdown
    // This is a simplified version of the PostHog cumulative query
    const query = `
      SELECT
        toDate(day_start) AS date,
        breakdown_value,
        cumulative_total
      FROM (
        SELECT
          day_start,
          breakdown_value,
          sum(count) OVER (
            PARTITION BY breakdown_value 
            ORDER BY day_start ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS cumulative_total
        FROM (
          SELECT
            toStartOfDay(timestamp) AS day_start,
            ifNull(nullIf(toString(properties.${breakdownProperty}), ''), 'other') AS breakdown_value,
            count(DISTINCT person_id) AS count
          FROM events
          WHERE timestamp >= '${startDate}'
            AND timestamp <= '${endDate}'
            AND event = 'fiveonefour_cli_install_script_run'
            ${
              excludeDevelopers
                ? `
            AND ifNull(not(match(toString(properties.$host), '^(localhost|127\\\\.0\\\\.0\\\\.1)($|:)')), 1)
            AND notEquals(properties.is_moose_developer, true)
            AND notEquals(properties.is_developer, true)
            AND notILike(toString(person.properties.email), '%fiveonefour.com%')
            `
                : ""
            }
            AND properties.${breakdownProperty} IN (${products
      .map((p) => `'${p}'`)
      .join(", ")})
          GROUP BY day_start, breakdown_value
          ORDER BY day_start ASC
        )
      )
      ORDER BY date ASC, breakdown_value ASC
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results || data.results.length === 0) {
      return {
        timeWindow: {
          ...timeWindow,
          comparisonPeriods: [],
        },
        totalInstalls: 0,
        dataPoints: [],
        breakdownSeries: [],
      };
    }

    // Process results into breakdown series
    const breakdownMap = new Map<
      string,
      Array<{ date: string; cumulativeTotal: number }>
    >();

    for (const row of data.results) {
      const date = String(row[0]);
      const breakdown = String(row[1]);
      const cumulativeTotal = Number(row[2]);

      if (!breakdownMap.has(breakdown)) {
        breakdownMap.set(breakdown, []);
      }

      breakdownMap.get(breakdown)!.push({ date, cumulativeTotal });
    }

    // Build breakdown series
    const breakdownSeries = Array.from(breakdownMap.entries())
      .map(([breakdown, dataPoints]) => ({
        breakdown,
        dataPoints,
        total: dataPoints[dataPoints.length - 1]?.cumulativeTotal || 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Calculate total installs (sum of latest values from each breakdown)
    const totalInstalls = breakdownSeries.reduce(
      (sum, series) => sum + series.total,
      0
    );

    // Create combined data points for overall view
    const dateMap = new Map<string, { date: string; total: number }>();
    for (const row of data.results) {
      const date = String(row[0]);
      const cumulativeTotal = Number(row[2]);

      if (!dateMap.has(date)) {
        dateMap.set(date, { date, total: 0 });
      }

      const current = dateMap.get(date)!;
      current.total = Math.max(current.total, cumulativeTotal);
    }

    const dataPoints = Array.from(dateMap.values())
      .map((point) => ({
        date: point.date,
        total: point.total,
        breakdown: "all",
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      timeWindow: {
        ...timeWindow,
        comparisonPeriods: [],
      },
      totalInstalls,
      dataPoints,
      breakdownSeries,
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching cumulative OSS installs: ${(error as Error).message}`
    );
  }
}

/**
 * Get cumulative projects per organization
 * Tracks project creation from postgres.projects data warehouse table
 */
export async function getCumulativeProjects(
  timeWindow: { startDate: string; endDate: string },
  options?: {
    breakdownProperty?: string;
    intervalUnit?: "day" | "week" | "month";
    topN?: number;
  }
): Promise<CumulativeProjectsMetrics> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    const breakdownProperty = options?.breakdownProperty || "org_id";
    const intervalUnit = options?.intervalUnit || "month";
    const topN = options?.topN || 25;

    // Map interval unit to HogQL interval function
    const intervalMap = {
      day: "toIntervalDay",
      week: "toIntervalWeek",
      month: "toIntervalMonth",
    };
    const intervalFunc = intervalMap[intervalUnit];
    const startOfIntervalFunc =
      intervalUnit === "week"
        ? "toStartOfWeek"
        : `toStartOf${
            intervalUnit.charAt(0).toUpperCase() + intervalUnit.slice(1)
          }`;

    // Build the main query for cumulative projects with breakdown by organization
    const query = `
      SELECT
        ${startOfIntervalFunc}(day_start) AS date,
        breakdown_value,
        cumulative_total
      FROM (
        SELECT
          day_start,
          breakdown_value,
          sum(count) OVER (
            PARTITION BY breakdown_value 
            ORDER BY day_start ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS cumulative_total
        FROM (
          SELECT
            ${startOfIntervalFunc}(created_at) AS day_start,
            ifNull(nullIf(toString(${breakdownProperty}), ''), 'unknown') AS breakdown_value,
            count() AS count
          FROM postgres.projects
          WHERE created_at >= '${startDate}'
            AND created_at <= '${endDate}'
          GROUP BY day_start, breakdown_value
          ORDER BY day_start ASC
        )
      )
      ORDER BY date ASC, breakdown_value ASC
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results || data.results.length === 0) {
      return {
        timeWindow: {
          ...timeWindow,
          comparisonPeriods: [],
        },
        totalProjects: 0,
        totalOrganizations: 0,
        dataPoints: [],
        breakdownSeries: [],
      };
    }

    // Process results into breakdown series
    const breakdownMap = new Map<
      string,
      Array<{ date: string; cumulativeTotal: number }>
    >();

    for (const row of data.results) {
      const date = String(row[0]);
      const breakdown = String(row[1]);
      const cumulativeTotal = Number(row[2]);

      if (!breakdownMap.has(breakdown)) {
        breakdownMap.set(breakdown, []);
      }

      breakdownMap.get(breakdown)!.push({ date, cumulativeTotal });
    }

    // Build breakdown series and sort by total
    const breakdownSeries = Array.from(breakdownMap.entries())
      .map(([breakdown, dataPoints]) => ({
        breakdown,
        dataPoints,
        total: dataPoints[dataPoints.length - 1]?.cumulativeTotal || 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Calculate total projects (sum of latest values from each breakdown)
    const totalProjects = breakdownSeries.reduce(
      (sum, series) => sum + series.total,
      0
    );

    // Count unique organizations
    const totalOrganizations = breakdownSeries.filter(
      (s) => s.breakdown !== "unknown"
    ).length;

    // Limit to top N organizations (merge others)
    let finalBreakdownSeries = breakdownSeries;
    if (breakdownSeries.length > topN) {
      const topSeries = breakdownSeries.slice(0, topN);
      const otherSeries = breakdownSeries.slice(topN);

      // Aggregate "other" organizations
      const otherDatesMap = new Map<string, number>();
      otherSeries.forEach((series) => {
        series.dataPoints.forEach((point) => {
          const current = otherDatesMap.get(point.date) || 0;
          otherDatesMap.set(point.date, current + point.cumulativeTotal);
        });
      });

      const otherDataPoints = Array.from(otherDatesMap.entries())
        .map(([date, cumulativeTotal]) => ({ date, cumulativeTotal }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (otherDataPoints.length > 0) {
        topSeries.push({
          breakdown: "other",
          dataPoints: otherDataPoints,
          total:
            otherDataPoints[otherDataPoints.length - 1]?.cumulativeTotal || 0,
        });
      }

      finalBreakdownSeries = topSeries;
    }

    // Create combined data points for overall view
    const dateMap = new Map<string, { date: string; total: number }>();
    for (const row of data.results) {
      const date = String(row[0]);
      const cumulativeTotal = Number(row[2]);

      if (!dateMap.has(date)) {
        dateMap.set(date, { date, total: 0 });
      }

      const current = dateMap.get(date)!;
      current.total += cumulativeTotal;
    }

    const dataPoints = Array.from(dateMap.values())
      .map((point) => ({
        date: point.date,
        total: point.total,
        breakdown: "all",
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      timeWindow: {
        ...timeWindow,
        comparisonPeriods: [],
      },
      totalProjects,
      totalOrganizations,
      dataPoints,
      breakdownSeries: finalBreakdownSeries,
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching cumulative projects: ${(error as Error).message}`
    );
  }
}

/**
 * Get GitHub stars count
 * Tracks cumulative GitHub stars accounting for additions and deletions
 */
export async function getGitHubStars(timeWindow: {
  startDate: string;
  endDate: string;
}): Promise<{
  currentStars: number;
  chartData: Array<{ date: string; stars: number }>;
}> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    // PostHog Trends query format - returns arrays
    const query = `
      SELECT
        arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('${startDate}')), toIntervalDay(1)), toIntervalDay(number)), range(0, plus(coalesce(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('${startDate}')), toIntervalDay(1)), toStartOfInterval(assumeNotNull(toDateTime('${endDate}')), toIntervalDay(1)))), 1))) AS date,
        arrayFill(x -> greater(x, 0), arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date)) AS total
      FROM (
        SELECT
          day_start,
          sum(count) OVER (ORDER BY day_start ASC) AS count
        FROM (
          SELECT
            sum(total) AS count,
            day_start
          FROM (
            SELECT
              count() AS total,
              toStartOfDay(timestamp) AS day_start
            FROM events AS e SAMPLE 1
            WHERE timestamp >= toStartOfInterval(assumeNotNull(toDateTime('${startDate}')), toIntervalDay(1))
              AND timestamp <= assumeNotNull(toDateTime('${endDate}'))
              AND event = 'GitHub Star'
              AND ifNull(not(match(toString(properties.$host), '^(localhost|127\\\\.0\\\\.0\\\\.1)($|:)')), 1)
              AND notEquals(properties.is_moose_developer, true)
              AND notEquals(properties.is_developer, true)
              AND notILike(toString(person.properties.email), '%fiveonefour.com%')
              AND notEquals(properties.action, 'deleted')
            GROUP BY day_start
          )
          GROUP BY day_start
          ORDER BY day_start ASC
        )
        ORDER BY day_start ASC
      )
      ORDER BY arraySum(total) DESC
      LIMIT 1
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results || data.results.length === 0) {
      return {
        currentStars: 0,
        chartData: [],
      };
    }

    // Parse the result - PostHog returns stringified arrays
    const row = data.results[0];
    let dates: string[];
    let totals: number[];

    try {
      // The results might be arrays or stringified arrays
      const datesRaw = row[0];
      const totalsRaw = row[1];

      // Check if already an array or needs parsing
      if (Array.isArray(datesRaw)) {
        dates = datesRaw.map(String);
      } else {
        const datesStr = String(datesRaw);
        dates = JSON.parse(datesStr);
      }

      if (Array.isArray(totalsRaw)) {
        totals = totalsRaw.map(Number);
      } else {
        const totalsStr = String(totalsRaw);
        totals = JSON.parse(totalsStr);
      }
    } catch (parseError) {
      console.error("Error parsing GitHub stars data:", parseError);
      console.error("Raw data:", row);
      // Return empty data if parsing fails
      return {
        currentStars: 0,
        chartData: [],
      };
    }

    // Build chart data
    const chartData: Array<{ date: string; stars: number }> = [];
    for (let i = 0; i < Math.min(dates.length, totals.length); i++) {
      chartData.push({
        date: dates[i],
        stars: totals[i],
      });
    }

    // Current stars is the last non-zero value
    const currentStars = totals[totals.length - 1] || 0;

    return {
      currentStars,
      chartData,
    };
  } catch (error) {
    console.error("Error in getGitHubStars:", error);
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching GitHub stars: ${(error as Error).message}`
    );
  }
}

/**
 * Get cumulative deployments per organization
 * Tracks deployments from postgres.deploys joined with postgres.projects
 */
export async function getCumulativeDeployments(
  timeWindow: { startDate: string; endDate: string },
  options?: {
    breakdownProperty?: string;
    intervalUnit?: "day" | "week" | "month";
    topN?: number;
    statusFilter?: string[];
  }
): Promise<CumulativeDeploymentsMetrics> {
  try {
    const startDate = formatDateForHogQL(timeWindow.startDate);
    const endDate = formatDateForHogQL(timeWindow.endDate);

    const breakdownProperty = options?.breakdownProperty || "org_id";
    const intervalUnit = options?.intervalUnit || "month";
    const topN = options?.topN || 25;
    const statusFilter = options?.statusFilter;

    // Map interval unit to HogQL interval function
    const startOfIntervalFunc =
      intervalUnit === "week"
        ? "toStartOfWeek"
        : `toStartOf${
            intervalUnit.charAt(0).toUpperCase() + intervalUnit.slice(1)
          }`;

    // Build status filter condition
    const statusCondition = statusFilter
      ? `AND d.status IN (${statusFilter.map((s) => `'${s}'`).join(", ")})`
      : "";

    // Build the main query for cumulative deployments with breakdown by organization
    const query = `
      SELECT
        ${startOfIntervalFunc}(day_start) AS date,
        breakdown_value,
        cumulative_total
      FROM (
        SELECT
          day_start,
          breakdown_value,
          sum(count) OVER (
            PARTITION BY breakdown_value 
            ORDER BY day_start ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS cumulative_total
        FROM (
          SELECT
            ${startOfIntervalFunc}(created_at) AS day_start,
            ifNull(nullIf(toString(${breakdownProperty}), ''), 'unknown') AS breakdown_value,
            count() AS count
          FROM (
            SELECT
              d.deploy_id,
              d.url,
              d.status,
              d.created_at,
              p.name AS project_name,
              p.repo_url,
              p.org_id
            FROM postgres.deploys AS d
            JOIN postgres.projects AS p ON equals(d.project_id, p.project_id)
            WHERE d.created_at >= '${startDate}'
              AND d.created_at <= '${endDate}'
              ${statusCondition}
            ORDER BY d.created_at DESC
          ) AS e
          GROUP BY day_start, breakdown_value
          ORDER BY day_start ASC
        )
      )
      ORDER BY date ASC, breakdown_value ASC
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    if (!data.results || data.results.length === 0) {
      return {
        timeWindow: {
          ...timeWindow,
          comparisonPeriods: [],
        },
        totalDeployments: 0,
        totalOrganizations: 0,
        dataPoints: [],
        breakdownSeries: [],
      };
    }

    // Process results into breakdown series
    const breakdownMap = new Map<
      string,
      Array<{ date: string; cumulativeTotal: number }>
    >();

    for (const row of data.results) {
      const date = String(row[0]);
      const breakdown = String(row[1]);
      const cumulativeTotal = Number(row[2]);

      if (!breakdownMap.has(breakdown)) {
        breakdownMap.set(breakdown, []);
      }

      breakdownMap.get(breakdown)!.push({ date, cumulativeTotal });
    }

    // Build breakdown series and sort by total
    const breakdownSeries = Array.from(breakdownMap.entries())
      .map(([breakdown, dataPoints]) => ({
        breakdown,
        dataPoints,
        total: dataPoints[dataPoints.length - 1]?.cumulativeTotal || 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Calculate total deployments (sum of latest values from each breakdown)
    const totalDeployments = breakdownSeries.reduce(
      (sum, series) => sum + series.total,
      0
    );

    // Count unique organizations
    const totalOrganizations = breakdownSeries.filter(
      (s) => s.breakdown !== "unknown"
    ).length;

    // Limit to top N organizations (merge others)
    let finalBreakdownSeries = breakdownSeries;
    if (breakdownSeries.length > topN) {
      const topSeries = breakdownSeries.slice(0, topN);
      const otherSeries = breakdownSeries.slice(topN);

      // Aggregate "other" organizations
      const otherDatesMap = new Map<string, number>();
      otherSeries.forEach((series) => {
        series.dataPoints.forEach((point) => {
          const current = otherDatesMap.get(point.date) || 0;
          otherDatesMap.set(point.date, current + point.cumulativeTotal);
        });
      });

      const otherDataPoints = Array.from(otherDatesMap.entries())
        .map(([date, cumulativeTotal]) => ({ date, cumulativeTotal }))
        .sort((a, b) => a.date.localeCompare(b.date));

      if (otherDataPoints.length > 0) {
        topSeries.push({
          breakdown: "other",
          dataPoints: otherDataPoints,
          total:
            otherDataPoints[otherDataPoints.length - 1]?.cumulativeTotal || 0,
        });
      }

      finalBreakdownSeries = topSeries;
    }

    // Create combined data points for overall view
    const dateMap = new Map<string, { date: string; total: number }>();
    for (const row of data.results) {
      const date = String(row[0]);
      const cumulativeTotal = Number(row[2]);

      if (!dateMap.has(date)) {
        dateMap.set(date, { date, total: 0 });
      }

      const current = dateMap.get(date)!;
      current.total += cumulativeTotal;
    }

    const dataPoints = Array.from(dateMap.values())
      .map((point) => ({
        date: point.date,
        total: point.total,
        breakdown: "all",
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      timeWindow: {
        ...timeWindow,
        comparisonPeriods: [],
      },
      totalDeployments,
      totalOrganizations,
      dataPoints,
      breakdownSeries: finalBreakdownSeries,
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching cumulative deployments: ${(error as Error).message}`
    );
  }
}
