/**
 * Web Analytics Metrics via PostHog
 * Traffic, sources, and conversion tracking
 */

import { posthogAnalyticsClient } from "./client";
import { ExternalAPIError } from "../shared/errors";
import {
  formatDateForHogQL,
  buildWhereClause,
  buildEventFilter,
} from "./filters";
import type {
  WebTrafficMetrics,
  TrafficSourceMetrics,
  ConversionFunnelMetrics,
} from "./schemas";

/**
 * Get web traffic metrics
 */
export async function getWebTrafficMetrics(
  startDate: string,
  endDate: string
): Promise<WebTrafficMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Get overall traffic stats
    const overallQuery = `
      SELECT 
        count(*) AS total_pageviews,
        count(DISTINCT person_id) AS unique_visitors,
        count(DISTINCT properties.$session_id) AS total_sessions
      FROM events
      WHERE ${buildWhereClause(formattedStart, formattedEnd, "$pageview")}
    `;

    const overallResult = await posthogAnalyticsClient.executeHogQL(
      overallQuery
    );
    const overallData = overallResult as { results?: unknown[][] };
    const totalPageViews = overallData.results?.[0]?.[0]
      ? Number(overallData.results[0][0])
      : 0;
    const uniqueVisitors = overallData.results?.[0]?.[1]
      ? Number(overallData.results[0][1])
      : 0;
    const totalSessions = overallData.results?.[0]?.[2]
      ? Number(overallData.results[0][2])
      : 0;

    // Calculate bounce rate (sessions with only 1 event)
    const bounceQuery = `
      SELECT 
        countIf(event_count = 1) AS bounced_sessions,
        count(*) AS total_sessions
      FROM (
        SELECT 
          properties.$session_id AS session_id,
          count(*) AS event_count
        FROM events
        WHERE ${buildWhereClause(formattedStart, formattedEnd)}
          AND properties.$session_id IS NOT NULL
        GROUP BY session_id
      )
    `;

    const bounceResult = await posthogAnalyticsClient.executeHogQL(bounceQuery);
    const bounceData = bounceResult as { results?: unknown[][] };
    const bouncedSessions = bounceData.results?.[0]?.[0]
      ? Number(bounceData.results[0][0])
      : 0;
    const sessionsForBounce = bounceData.results?.[0]?.[1]
      ? Number(bounceData.results[0][1])
      : 0;
    const bounceRate =
      sessionsForBounce > 0 ? (bouncedSessions / sessionsForBounce) * 100 : 0;

    // Get top pages
    const topPagesQuery = `
      SELECT 
        properties.$current_url AS pathname,
        count(*) AS views,
        count(DISTINCT person_id) AS unique_visitors
      FROM events
      WHERE ${buildWhereClause(formattedStart, formattedEnd, "$pageview")}
      GROUP BY pathname
      ORDER BY views DESC
      LIMIT 10
    `;

    const topPagesResult = await posthogAnalyticsClient.executeHogQL(
      topPagesQuery
    );
    const topPagesData = topPagesResult as { results?: unknown[][] };
    const topPages = (topPagesData.results || []).map((row: unknown[]) => ({
      pathname: String(row[0]),
      views: Number(row[1] || 0),
      uniqueVisitors: Number(row[2] || 0),
    }));

    // Get time series data (daily)
    const timeSeriesQuery = `
      SELECT 
        toStartOfDay(timestamp) AS day,
        count(*) AS pageviews,
        count(DISTINCT person_id) AS visitors,
        count(DISTINCT properties.$session_id) AS sessions
      FROM events
      WHERE ${buildWhereClause(formattedStart, formattedEnd, "$pageview")}
      GROUP BY day
      ORDER BY day ASC
    `;

    const timeSeriesResult = await posthogAnalyticsClient.executeHogQL(
      timeSeriesQuery
    );
    const timeSeriesData = timeSeriesResult as { results?: unknown[][] };
    const timeSeries = (timeSeriesData.results || []).map((row: unknown[]) => ({
      date: String(row[0]),
      pageViews: Number(row[1] || 0),
      visitors: Number(row[2] || 0),
      sessions: Number(row[3] || 0),
    }));

    return {
      totalPageViews,
      uniqueVisitors,
      totalSessions,
      bounceRate,
      topPages,
      timeSeries,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching web traffic metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get traffic source metrics
 */
export async function getTrafficSourceMetrics(
  startDate: string,
  endDate: string
): Promise<TrafficSourceMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Get traffic by referrer
    const referrerQuery = `
      SELECT 
        properties.$referring_domain AS referrer,
        count(DISTINCT person_id) AS visitors,
        0 AS conversions
      FROM events
      WHERE ${buildWhereClause(formattedStart, formattedEnd, "$pageview")}
        AND properties.$referring_domain != ''
      GROUP BY referrer
      ORDER BY visitors DESC
      LIMIT 10
    `;

    const referrerResult = await posthogAnalyticsClient.executeHogQL(
      referrerQuery
    );
    const referrerData = referrerResult as { results?: unknown[][] };
    const byReferrer = (referrerData.results || []).map((row: unknown[]) => {
      const visitors = Number(row[1] || 0);
      const conversions = Number(row[2] || 0);
      return {
        referrer: String(row[0]),
        visitors,
        conversions,
        conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0,
      };
    });

    // Get traffic by UTM source
    const utmQuery = `
      SELECT 
        properties.utm_source AS source,
        properties.utm_medium AS medium,
        properties.utm_campaign AS campaign,
        count(DISTINCT person_id) AS visitors,
        0 AS conversions
      FROM events
      WHERE ${buildWhereClause(formattedStart, formattedEnd, "$pageview")}
        AND properties.utm_source IS NOT NULL
      GROUP BY source, medium, campaign
      ORDER BY visitors DESC
      LIMIT 10
    `;

    const utmResult = await posthogAnalyticsClient.executeHogQL(utmQuery);
    const utmData = utmResult as { results?: unknown[][] };
    const byUtmSource = (utmData.results || []).map((row: unknown[]) => ({
      source: String(row[0]),
      medium: row[1] ? String(row[1]) : undefined,
      campaign: row[2] ? String(row[2]) : undefined,
      visitors: Number(row[3] || 0),
      conversions: Number(row[4] || 0),
    }));

    // Get direct/organic/paid traffic counts
    const trafficTypeQuery = `
      SELECT 
        countIf(properties.$referring_domain = '' OR properties.$referring_domain IS NULL) AS direct,
        countIf(properties.$referring_domain != '' AND properties.utm_source IS NULL) AS organic,
        countIf(properties.utm_source IS NOT NULL) AS paid
      FROM events
      WHERE ${buildWhereClause(formattedStart, formattedEnd, "$pageview")}
    `;

    const trafficTypeResult = await posthogAnalyticsClient.executeHogQL(
      trafficTypeQuery
    );
    const trafficTypeData = trafficTypeResult as { results?: unknown[][] };
    const directTraffic = trafficTypeData.results?.[0]?.[0]
      ? Number(trafficTypeData.results[0][0])
      : 0;
    const organicTraffic = trafficTypeData.results?.[0]?.[1]
      ? Number(trafficTypeData.results[0][1])
      : 0;
    const paidTraffic = trafficTypeData.results?.[0]?.[2]
      ? Number(trafficTypeData.results[0][2])
      : 0;

    return {
      byReferrer,
      byUtmSource,
      directTraffic,
      organicTraffic,
      paidTraffic,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching traffic source metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get conversion funnel metrics
 */
export async function getConversionFunnelMetrics(
  funnelName: string,
  events: string[],
  startDate: string,
  endDate: string
): Promise<ConversionFunnelMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Build event list for query
    const eventsList = events.map((e) => `'${e}'`).join(", ");

    // Get funnel conversion data
    // Simplified approach - count users who completed each step
    const funnelSteps: ConversionFunnelMetrics["steps"] = [];
    let previousStepUsers = 0;

    for (let i = 0; i < events.length; i++) {
      const eventName = events[i];

      const stepQuery = `
        SELECT count(DISTINCT person_id) AS user_count
        FROM events
        WHERE ${buildWhereClause(formattedStart, formattedEnd, eventName)}
      `;

      const stepResult = await posthogAnalyticsClient.executeHogQL(stepQuery);
      const stepData = stepResult as { results?: unknown[][] };
      const userCount = stepData.results?.[0]?.[0]
        ? Number(stepData.results[0][0])
        : 0;

      if (i === 0) {
        previousStepUsers = userCount;
      }

      const conversionRate =
        previousStepUsers > 0 ? (userCount / previousStepUsers) * 100 : 0;
      const dropOffRate = 100 - conversionRate;

      funnelSteps.push({
        stepName: `Step ${i + 1}`,
        eventName,
        userCount,
        conversionRate,
        dropOffRate,
      });

      previousStepUsers = userCount;
    }

    const totalEntered = funnelSteps[0]?.userCount || 0;
    const totalCompleted = funnelSteps[funnelSteps.length - 1]?.userCount || 0;
    const overallConversionRate =
      totalEntered > 0 ? (totalCompleted / totalEntered) * 100 : 0;

    // Get average time to convert (simplified)
    const timeToConvertQuery = `
      SELECT 
        avg(dateDiff('second', min_time, max_time)) AS avg_time
      FROM (
        SELECT 
          person_id,
          min(timestamp) AS min_time,
          max(timestamp) AS max_time
        FROM events
        WHERE timestamp >= '${formattedStart}'
          AND timestamp <= '${formattedEnd}'
          AND event IN (${eventsList})
        GROUP BY person_id
        HAVING count(DISTINCT event) = ${events.length}
      )
    `;

    const timeResult = await posthogAnalyticsClient.executeHogQL(
      timeToConvertQuery
    );
    const timeData = timeResult as { results?: unknown[][] };
    const averageTimeToConvert = timeData.results?.[0]?.[0]
      ? Number(timeData.results[0][0])
      : 0;

    return {
      funnelName,
      totalEntered,
      totalCompleted,
      overallConversionRate,
      averageTimeToConvert,
      steps: funnelSteps,
      bySource: [], // Simplified - can be enhanced later
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching conversion funnel metrics: ${(error as Error).message}`
    );
  }
}

