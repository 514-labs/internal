/**
 * HubSpot GTM Metrics via PostHog Data Warehouse
 * Query HubSpot contacts, deals, and companies data
 */

import { posthogAnalyticsClient } from "./client";
import { ExternalAPIError } from "../shared/errors";
import { formatDateForHogQL } from "./filters";
import type {
  LeadGenerationMetrics,
  SalesPipelineMetrics,
} from "./schemas";

/**
 * Get lead generation metrics from HubSpot contacts
 */
export async function getLeadGenerationMetrics(
  startDate: string,
  endDate: string
): Promise<LeadGenerationMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Get total and new contacts
    const contactsQuery = `
      SELECT 
        count(*) AS total_contacts,
        countIf(createdate >= '${formattedStart}') AS new_contacts
      FROM hubspot_contacts
      WHERE createdate <= '${formattedEnd}'
    `;

    const contactsResult = await posthogAnalyticsClient.executeHogQL(
      contactsQuery
    );
    const contactsData = contactsResult as { results?: unknown[][] };
    const totalContacts = contactsData.results?.[0]?.[0]
      ? Number(contactsData.results[0][0])
      : 0;
    const newContacts = contactsData.results?.[0]?.[1]
      ? Number(contactsData.results[0][1])
      : 0;

    // Get MQLs and SQLs
    const qualifiedQuery = `
      SELECT 
        countIf(lifecyclestage = 'marketingqualifiedlead') AS mqls,
        countIf(lifecyclestage = 'salesqualifiedlead') AS sqls
      FROM hubspot_contacts
      WHERE createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
    `;

    const qualifiedResult = await posthogAnalyticsClient.executeHogQL(
      qualifiedQuery
    );
    const qualifiedData = qualifiedResult as { results?: unknown[][] };
    const mqls = qualifiedData.results?.[0]?.[0]
      ? Number(qualifiedData.results[0][0])
      : 0;
    const sqls = qualifiedData.results?.[0]?.[1]
      ? Number(qualifiedData.results[0][1])
      : 0;

    // Get lifecycle stage distribution
    const stageQuery = `
      SELECT 
        lifecyclestage,
        count(*) AS count
      FROM hubspot_contacts
      WHERE createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
      GROUP BY lifecyclestage
      ORDER BY count DESC
    `;

    const stageResult = await posthogAnalyticsClient.executeHogQL(stageQuery);
    const stageData = stageResult as { results?: unknown[][] };
    const byLifecycleStage = (stageData.results || []).map((row: unknown[]) => ({
      stage: String(row[0] || "unknown"),
      count: Number(row[1] || 0),
    }));

    // Get time series data (monthly)
    const timeSeriesQuery = `
      SELECT 
        toStartOfMonth(toDateTime(createdate)) AS month,
        count(*) AS contacts,
        countIf(lifecyclestage = 'marketingqualifiedlead') AS mqls,
        countIf(lifecyclestage = 'salesqualifiedlead') AS sqls
      FROM hubspot_contacts
      WHERE createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
      GROUP BY month
      ORDER BY month ASC
    `;

    const timeSeriesResult = await posthogAnalyticsClient.executeHogQL(
      timeSeriesQuery
    );
    const timeSeriesData = timeSeriesResult as { results?: unknown[][] };
    const timeSeries = (timeSeriesData.results || []).map((row: unknown[]) => ({
      date: String(row[0]),
      contacts: Number(row[1] || 0),
      mqls: Number(row[2] || 0),
      sqls: Number(row[3] || 0),
    }));

    // Calculate conversion rates
    const contactToLeadRate =
      totalContacts > 0 ? ((mqls + sqls) / totalContacts) * 100 : 0;

    // Calculate lead velocity (simplified - based on new contacts)
    const leadVelocity =
      timeSeries.length > 1
        ? ((timeSeries[timeSeries.length - 1].contacts -
            timeSeries[0].contacts) /
            timeSeries.length) *
          100
        : 0;

    return {
      totalContacts,
      newContacts,
      mqls,
      sqls,
      contactToLeadRate,
      leadVelocity,
      byLifecycleStage,
      timeSeries,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching lead generation metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get sales pipeline metrics from HubSpot deals
 */
export async function getSalesPipelineMetrics(
  startDate: string,
  endDate: string
): Promise<SalesPipelineMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Get deals by stage (excluding closedlost)
    const dealsByStageQuery = `
      SELECT 
        dealstage,
        count(*) AS number_of_deals,
        sum(amount) AS total_value
      FROM hubspot_deals_processed
      WHERE dealstage != 'closedlost'
        AND createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
      GROUP BY dealstage
      ORDER BY 
        CASE dealstage
          WHEN 'awareness' THEN 1
          WHEN 'exploration' THEN 2
          WHEN 'selection' THEN 3
          WHEN 'closedwon' THEN 4
          ELSE 65
        END
    `;

    const dealsByStageResult = await posthogAnalyticsClient.executeHogQL(
      dealsByStageQuery
    );
    const dealsByStageData = dealsByStageResult as { results?: unknown[][] };
    const dealsByStage = (dealsByStageData.results || []).map(
      (row: unknown[]) => ({
        stage: String(row[0]),
        count: Number(row[1] || 0),
        value: Number(row[2] || 0),
      })
    );

    // Get total metrics
    const totalDeals = dealsByStage.reduce((sum, d) => sum + d.count, 0);
    const pipelineValue = dealsByStage.reduce((sum, d) => sum + d.value, 0);
    const averageDealSize = totalDeals > 0 ? pipelineValue / totalDeals : 0;

    // Get closed won and total for win rate
    const winRateQuery = `
      SELECT 
        countIf(dealstage = 'closedwon') AS won,
        count(*) AS total
      FROM hubspot_deals_processed
      WHERE createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
    `;

    const winRateResult = await posthogAnalyticsClient.executeHogQL(
      winRateQuery
    );
    const winRateData = winRateResult as { results?: unknown[][] };
    const wonDeals = winRateData.results?.[0]?.[0]
      ? Number(winRateData.results[0][0])
      : 0;
    const totalDealsForWinRate = winRateData.results?.[0]?.[1]
      ? Number(winRateData.results[0][1])
      : 0;
    const winRate =
      totalDealsForWinRate > 0 ? (wonDeals / totalDealsForWinRate) * 100 : 0;

    // Get average sales cycle
    const salesCycleQuery = `
      SELECT 
        avg(dateDiff('day', toDateTime(createdate), toDateTime(closedate))) AS avg_cycle
      FROM hubspot_deals_processed
      WHERE dealstage = 'closedwon'
        AND closedate IS NOT NULL
        AND createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
    `;

    const salesCycleResult = await posthogAnalyticsClient.executeHogQL(
      salesCycleQuery
    );
    const salesCycleData = salesCycleResult as { results?: unknown[][] };
    const averageSalesCycle = salesCycleData.results?.[0]?.[0]
      ? Number(salesCycleData.results[0][0])
      : 0;

    // Calculate conversion rates between stages
    const conversionRates = [];
    const stages = ["awareness", "exploration", "selection", "closedwon"];

    for (let i = 0; i < stages.length - 1; i++) {
      const fromStage = stages[i];
      const toStage = stages[i + 1];

      const fromCount =
        dealsByStage.find((d) => d.stage === fromStage)?.count || 0;
      const toCount =
        dealsByStage.find((d) => d.stage === toStage)?.count || 0;

      const rate = fromCount > 0 ? (toCount / fromCount) * 100 : 0;

      conversionRates.push({
        fromStage,
        toStage,
        rate,
      });
    }

    return {
      totalDeals,
      pipelineValue,
      averageDealSize,
      winRate,
      averageSalesCycle,
      dealsByStage,
      conversionRates,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching sales pipeline metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get customer lifecycle metrics from HubSpot contacts
 */
export async function getCustomerLifecycleMetrics(
  startDate: string,
  endDate: string
): Promise<{
  stageDistribution: Array<{ stage: string; count: number; percentage: number }>;
  churnRate: number;
  timeWindow: { startDate: string; endDate: string };
}> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Get stage distribution
    const stageQuery = `
      SELECT 
        lifecyclestage,
        count(*) AS count
      FROM hubspot_contacts
      WHERE createdate <= '${formattedEnd}'
      GROUP BY lifecyclestage
      ORDER BY count DESC
    `;

    const stageResult = await posthogAnalyticsClient.executeHogQL(stageQuery);
    const stageData = stageResult as { results?: unknown[][] };

    const totalContacts = (stageData.results || []).reduce(
      (sum, row: unknown[]) => sum + Number(row[1] || 0),
      0
    );

    const stageDistribution = (stageData.results || []).map(
      (row: unknown[]) => {
        const count = Number(row[1] || 0);
        return {
          stage: String(row[0] || "unknown"),
          count,
          percentage: totalContacts > 0 ? (count / totalContacts) * 100 : 0,
        };
      }
    );

    // Calculate churn rate (simplified - based on contacts with specific status)
    const churnQuery = `
      SELECT 
        countIf(hs_lead_status = 'UNQUALIFIED' OR lifecyclestage = 'other') AS churned,
        count(*) AS total
      FROM hubspot_contacts
      WHERE createdate >= '${formattedStart}'
        AND createdate <= '${formattedEnd}'
    `;

    const churnResult = await posthogAnalyticsClient.executeHogQL(churnQuery);
    const churnData = churnResult as { results?: unknown[][] };
    const churned = churnData.results?.[0]?.[0]
      ? Number(churnData.results[0][0])
      : 0;
    const total = churnData.results?.[0]?.[1]
      ? Number(churnData.results[0][1])
      : 0;
    const churnRate = total > 0 ? (churned / total) * 100 : 0;

    return {
      stageDistribution,
      churnRate,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching customer lifecycle metrics: ${(error as Error).message}`
    );
  }
}

