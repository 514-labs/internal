/**
 * Product Metrics via PostHog
 * Moosestack, Boreal, and GitHub metrics with production-quality queries
 */

import { posthogAnalyticsClient } from "./client";
import { ExternalAPIError } from "../shared/errors";
import {
  formatDateForHogQL,
  buildInternalTrafficFilters,
  buildDateRangeFilter,
  combineFilters,
} from "./filters";
import {
  parseBreakdownResults,
  parseCumulativeResults,
  type BreakdownDataPoint,
} from "./helpers";
import type {
  MoosestackInstallMetrics,
  MoosestackCommandMetrics,
  BorealDeploymentMetrics,
  BorealProjectMetrics,
  GitHubStarMetrics,
} from "./schemas";

/**
 * Get Moosestack install metrics with breakdown by CLI name
 */
export async function getMoosestackInstallMetrics(
  startDate: string,
  endDate: string
): Promise<MoosestackInstallMetrics> {
  try {
    console.log("[getMoosestackInstallMetrics] Start:", { startDate, endDate });
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);
    console.log("[getMoosestackInstallMetrics] Formatted dates:", {
      formattedStart,
      formattedEnd,
    });

    // Build filters
    const filters = [
      ...buildDateRangeFilter(formattedStart, formattedEnd),
      "equals(event, 'fiveonefour_cli_install_script_run')",
      ...buildInternalTrafficFilters(),
      "in(e.properties_group_custom[%(hogql_val_2)s], tuple('moose', 'aurora', 'sloan'))",
    ];

    const whereClause = combineFilters(filters);
    console.log("[getMoosestackInstallMetrics] WHERE clause:", whereClause);

    // Query for installs by CLI name with cumulative time series
    const query = `
      SELECT
        groupArray(1)(date)[1] AS date,
        arrayFold((acc, x) -> arrayMap(i -> plus(acc[i], x[i]), range(1, plus(length(date), 1))), groupArray(ifNull(total, 0)), arrayWithConstant(length(date), reinterpretAsFloat64(0))) AS total,
        arrayMap(i -> if(ifNull(greaterOrEquals(row_number, 25), 0), '$$_posthog_breakdown_other_$$', i), breakdown_value) AS breakdown_value
      FROM (
        SELECT
          arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalDay(1)), toIntervalDay(number)), range(0, plus(coalesce(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalDay(1)), toStartOfInterval(assumeNotNull(toDateTime('${formattedEnd}')), toIntervalDay(1)))), 1))) AS date,
          arrayFill(x -> greater(x, 0), arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date)) AS total,
          breakdown_value AS breakdown_value,
          rowNumberInAllBlocks() AS row_number
        FROM (
          SELECT
            day_start,
            sum(count) OVER (PARTITION BY breakdown_value ORDER BY day_start ASC) AS count,
            breakdown_value
          FROM (
            SELECT
              sum(total) AS count,
              day_start,
              [ifNull(toString(breakdown_value_1), '$$_posthog_breakdown_null_$$')] AS breakdown_value
            FROM (
              SELECT
                count(DISTINCT e.person_id) AS total,
                min(toStartOfDay(timestamp)) AS day_start,
                ifNull(nullIf(toString(properties.cli_name), ''), '$$_posthog_breakdown_null_$$') AS breakdown_value_1
              FROM events AS e SAMPLE 1
              WHERE ${whereClause}
              GROUP BY e.person_id, breakdown_value_1
            )
            GROUP BY day_start, breakdown_value_1
            ORDER BY day_start ASC, breakdown_value ASC
          )
          ORDER BY day_start ASC
        )
        GROUP BY breakdown_value
        ORDER BY 
          if(has(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(has(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
          arraySum(total) DESC,
          breakdown_value ASC
      )
      WHERE arrayExists(x -> isNotNull(x), breakdown_value)
      GROUP BY breakdown_value
      ORDER BY 
        if(has(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(has(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
        arraySum(total) DESC,
        breakdown_value ASC
      LIMIT 50000
    `;

    console.log("[getMoosestackInstallMetrics] Executing query...");
    console.log(
      "[getMoosestackInstallMetrics] Query:",
      query.substring(0, 500) + "..."
    );

    const result = await posthogAnalyticsClient.executeHogQL(query);
    console.log(
      "[getMoosestackInstallMetrics] Raw result:",
      JSON.stringify(result, null, 2)
    );

    const data = result as { results?: unknown[][] };
    console.log("[getMoosestackInstallMetrics] Results array:", data.results);

    const breakdownData = parseBreakdownResults(data.results || []);
    console.log(
      "[getMoosestackInstallMetrics] Parsed breakdown:",
      breakdownData
    );

    // Transform to schema format
    const installsByProduct = breakdownData
      .filter((bd) => bd.breakdown !== "$$_posthog_breakdown_null_$$")
      .map((bd) => ({
        product: bd.breakdown,
        installs: bd.value,
        timeSeries:
          bd.timeSeries?.map((ts) => ({
            date: ts.date,
            installs: ts.value,
          })) || [],
      }));

    const totalInstalls = installsByProduct.reduce(
      (sum, p) => sum + p.installs,
      0
    );
    const uniqueInstalls = totalInstalls; // Already counting distinct person_id

    console.log("[getMoosestackInstallMetrics] Final result:", {
      totalInstalls,
      uniqueInstalls,
      installsByProduct: installsByProduct.length,
    });

    return {
      totalInstalls,
      uniqueInstalls,
      installsByProduct,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    console.error("[getMoosestackInstallMetrics] Error:", error);
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching Moosestack install metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get Moosestack CLI command usage metrics
 */
export async function getMoosestackCommandMetrics(
  startDate: string,
  endDate: string
): Promise<MoosestackCommandMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Build filters
    const filters = [
      ...buildDateRangeFilter(formattedStart, formattedEnd),
      "equals(event, 'moose_cli_command')",
      ...buildInternalTrafficFilters(),
    ];

    const whereClause = combineFilters(filters);

    // Query for command usage by command name with weekly time series
    const query = `
      SELECT
        groupArray(1)(date)[1] AS date,
        arrayFold((acc, x) -> arrayMap(i -> plus(acc[i], x[i]), range(1, plus(length(date), 1))), groupArray(ifNull(total, 0)), arrayWithConstant(length(date), reinterpretAsFloat64(0))) AS total,
        arrayMap(i -> if(ifNull(greaterOrEquals(row_number, 25), 0), '$$_posthog_breakdown_other_$$', i), breakdown_value) AS breakdown_value
      FROM (
        SELECT
          arrayMap(number -> plus(toStartOfWeek(assumeNotNull(toDateTime('${formattedStart}'))), toIntervalWeek(number)), range(0, plus(coalesce(dateDiff('week', toStartOfWeek(assumeNotNull(toDateTime('${formattedStart}'))), toStartOfWeek(assumeNotNull(toDateTime('${formattedEnd}'))))), 1))) AS date,
          arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date) AS total,
          breakdown_value AS breakdown_value,
          rowNumberInAllBlocks() AS row_number
        FROM (
          SELECT
            sum(total) AS count,
            day_start,
            [ifNull(toString(breakdown_value_1), '$$_posthog_breakdown_null_$$')] AS breakdown_value
          FROM (
            SELECT
              count() AS total,
              toStartOfWeek(timestamp) AS day_start,
              ifNull(nullIf(toString(properties.command), ''), '$$_posthog_breakdown_null_$$') AS breakdown_value_1
            FROM events AS e SAMPLE 1
            WHERE ${whereClause}
            GROUP BY day_start, breakdown_value_1
          )
          GROUP BY day_start, breakdown_value_1
          ORDER BY day_start ASC, breakdown_value ASC
        )
        GROUP BY breakdown_value
        ORDER BY 
          if(has(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(has(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
          arraySum(total) DESC,
          breakdown_value ASC
      )
      WHERE arrayExists(x -> isNotNull(x), breakdown_value)
      GROUP BY breakdown_value
      ORDER BY 
        if(has(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(has(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
        arraySum(total) DESC,
        breakdown_value ASC
      LIMIT 50000
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    const breakdownData = parseBreakdownResults(data.results || []);

    // Transform to schema format
    const topCommands = breakdownData
      .filter((bd) => bd.breakdown !== "$$_posthog_breakdown_null_$$")
      .map((bd) => ({
        command: bd.breakdown,
        count: bd.value,
        timeSeries:
          bd.timeSeries?.map((ts) => ({
            date: ts.date,
            count: ts.value,
          })) || [],
      }));

    const totalCommands = topCommands.reduce((sum, c) => sum + c.count, 0);

    return {
      totalCommands,
      topCommands,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching Moosestack command metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get Boreal deployment metrics from PostgreSQL data warehouse
 */
export async function getBorealDeploymentMetrics(
  startDate: string,
  endDate: string
): Promise<BorealDeploymentMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Query for deployments by org with monthly cumulative time series
    const query = `
      SELECT
        groupArray(1)(date)[1] AS date,
        arrayFold((acc, x) -> arrayMap(i -> plus(acc[i], x[i]), range(1, plus(length(date), 1))), groupArray(ifNull(total, 0)), arrayWithConstant(length(date), reinterpretAsFloat64(0))) AS total,
        if(ifNull(greaterOrEquals(row_number, 25), 0), '$$_posthog_breakdown_other_$$', breakdown_value) AS breakdown_value
      FROM (
        SELECT
          arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalMonth(1)), toIntervalMonth(number)), range(0, plus(coalesce(dateDiff('month', toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalMonth(1)), toStartOfInterval(assumeNotNull(toDateTime('${formattedEnd}')), toIntervalMonth(1)))), 1))) AS date,
          arrayFill(x -> greater(x, 0), arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date)) AS total,
          breakdown_value AS breakdown_value,
          rowNumberInAllBlocks() AS row_number
        FROM (
          SELECT
            day_start,
            sum(count) OVER (PARTITION BY breakdown_value ORDER BY day_start ASC) AS count,
            breakdown_value
          FROM (
            SELECT
              sum(total) AS count,
              day_start,
              breakdown_value
            FROM (
              SELECT
                count() AS total,
                toStartOfMonth(created_at) AS day_start,
                ifNull(nullIf(toString(org_id), ''), '$$_posthog_breakdown_null_$$') AS breakdown_value
              FROM (
                SELECT
                  d.deploy_id,
                  d.url,
                  d.status,
                  d.created_at,
                  p.name AS project_name,
                  p.repo_url,
                  p.org_id
                FROM \`postgres.deploys\` AS d
                JOIN \`postgres.projects\` AS p ON equals(d.project_id, p.project_id)
                ORDER BY d.created_at DESC
              ) AS e
              WHERE and(
                greaterOrEquals(created_at, toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalMonth(1))),
                lessOrEquals(created_at, assumeNotNull(toDateTime('${formattedEnd}')))
              )
              GROUP BY day_start, breakdown_value
            )
            GROUP BY day_start, breakdown_value
            ORDER BY day_start ASC, breakdown_value ASC
          )
          ORDER BY day_start ASC
        )
        GROUP BY breakdown_value
        ORDER BY 
          if(equals(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(equals(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
          arraySum(total) DESC,
          breakdown_value ASC
      )
      WHERE notEquals(breakdown_value, NULL)
      GROUP BY breakdown_value
      ORDER BY 
        if(equals(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(equals(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
        arraySum(total) DESC,
        breakdown_value ASC
      LIMIT 50000
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    const breakdownData = parseBreakdownResults(data.results || []);

    // Get recent deployments
    const recentQuery = `
      SELECT
        d.deploy_id,
        p.name AS project_name,
        p.repo_url,
        d.status,
        d.created_at,
        p.org_id
      FROM \`postgres.deploys\` AS d
      JOIN \`postgres.projects\` AS p ON equals(d.project_id, p.project_id)
      WHERE d.created_at >= '${formattedStart}'
        AND d.created_at <= '${formattedEnd}'
      ORDER BY d.created_at DESC
      LIMIT 20
    `;

    const recentResult = await posthogAnalyticsClient.executeHogQL(recentQuery);
    const recentData = recentResult as { results?: unknown[][] };

    const recentDeployments = (recentData.results || []).map(
      (row: unknown[]) => ({
        deployId: String(row[0]),
        projectName: String(row[1]),
        repoUrl: row[2] ? String(row[2]) : undefined,
        status: String(row[3]),
        createdAt: String(row[4]),
        orgId: String(row[5]),
      })
    );

    // Transform to schema format
    const deploymentsByOrg = breakdownData
      .filter((bd) => bd.breakdown !== "$$_posthog_breakdown_null_$$")
      .map((bd) => ({
        orgId: bd.breakdown,
        deployments: bd.value,
        timeSeries:
          bd.timeSeries?.map((ts) => ({
            date: ts.date,
            deployments: ts.value,
          })) || [],
      }));

    const totalDeployments = deploymentsByOrg.reduce(
      (sum, d) => sum + d.deployments,
      0
    );

    return {
      totalDeployments,
      deploymentsByOrg,
      recentDeployments,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching Boreal deployment metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get Boreal project metrics from PostgreSQL data warehouse
 */
export async function getBorealProjectMetrics(
  startDate: string,
  endDate: string
): Promise<BorealProjectMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Query for projects by org with monthly cumulative time series
    const query = `
      SELECT
        groupArray(1)(date)[1] AS date,
        arrayFold((acc, x) -> arrayMap(i -> plus(acc[i], x[i]), range(1, plus(length(date), 1))), groupArray(ifNull(total, 0)), arrayWithConstant(length(date), reinterpretAsFloat64(0))) AS total,
        if(ifNull(greaterOrEquals(row_number, 25), 0), '$$_posthog_breakdown_other_$$', breakdown_value) AS breakdown_value
      FROM (
        SELECT
          arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalMonth(1)), toIntervalMonth(number)), range(0, plus(coalesce(dateDiff('month', toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalMonth(1)), toStartOfInterval(assumeNotNull(toDateTime('${formattedEnd}')), toIntervalMonth(1)))), 1))) AS date,
          arrayFill(x -> greater(x, 0), arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), date)) AS total,
          breakdown_value AS breakdown_value,
          rowNumberInAllBlocks() AS row_number
        FROM (
          SELECT
            day_start,
            sum(count) OVER (PARTITION BY breakdown_value ORDER BY day_start ASC) AS count,
            breakdown_value
          FROM (
            SELECT
              sum(total) AS count,
              day_start,
              breakdown_value
            FROM (
              SELECT
                count() AS total,
                toStartOfMonth(created_at) AS day_start,
                ifNull(nullIf(toString(org_id), ''), '$$_posthog_breakdown_null_$$') AS breakdown_value
              FROM \`postgres.projects\` AS e
              WHERE and(
                greaterOrEquals(created_at, toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalMonth(1))),
                lessOrEquals(created_at, assumeNotNull(toDateTime('${formattedEnd}')))
              )
              GROUP BY day_start, breakdown_value
            )
            GROUP BY day_start, breakdown_value
            ORDER BY day_start ASC, breakdown_value ASC
          )
          ORDER BY day_start ASC
        )
        GROUP BY breakdown_value
        ORDER BY 
          if(equals(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(equals(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
          arraySum(total) DESC,
          breakdown_value ASC
      )
      WHERE notEquals(breakdown_value, NULL)
      GROUP BY breakdown_value
      ORDER BY 
        if(equals(breakdown_value, '$$_posthog_breakdown_other_$$'), 2, if(equals(breakdown_value, '$$_posthog_breakdown_null_$$'), 1, 0)) ASC,
        arraySum(total) DESC,
        breakdown_value ASC
      LIMIT 50000
    `;

    const result = await posthogAnalyticsClient.executeHogQL(query);
    const data = result as { results?: unknown[][] };

    const breakdownData = parseBreakdownResults(data.results || []);

    // Transform to schema format
    const projectsByOrg = breakdownData
      .filter((bd) => bd.breakdown !== "$$_posthog_breakdown_null_$$")
      .map((bd) => ({
        orgId: bd.breakdown,
        projects: bd.value,
        timeSeries:
          bd.timeSeries?.map((ts) => ({
            date: ts.date,
            projects: ts.value,
          })) || [],
      }));

    const totalProjects = projectsByOrg.reduce((sum, p) => sum + p.projects, 0);

    return {
      totalProjects,
      projectsByOrg,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching Boreal project metrics: ${(error as Error).message}`
    );
  }
}

/**
 * Get GitHub star metrics
 */
export async function getGitHubStarMetrics(
  startDate: string,
  endDate: string
): Promise<GitHubStarMetrics> {
  try {
    const formattedStart = formatDateForHogQL(startDate);
    const formattedEnd = formatDateForHogQL(endDate);

    // Build filters for stars added
    const addedFilters = [
      ...buildDateRangeFilter(formattedStart, formattedEnd),
      "equals(event, 'GitHub Star')",
      ...buildInternalTrafficFilters(),
      "notEquals(properties.action, 'deleted')",
    ];

    // Build filters for stars removed
    const removedFilters = [
      ...buildDateRangeFilter(formattedStart, formattedEnd),
      "equals(event, 'GitHub Star')",
      ...buildInternalTrafficFilters(),
      "equals(properties.action, 'deleted')",
    ];

    // Query for stars added (cumulative)
    const addedQuery = `
      SELECT
        arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalDay(1)), toIntervalDay(number)), range(0, plus(coalesce(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalDay(1)), toStartOfInterval(assumeNotNull(toDateTime('${formattedEnd}')), toIntervalDay(1)))), 1))) AS date,
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
            WHERE ${combineFilters(addedFilters)}
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

    // Query for stars removed (cumulative)
    const removedQuery = `
      SELECT
        arrayMap(number -> plus(toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalDay(1)), toIntervalDay(number)), range(0, plus(coalesce(dateDiff('day', toStartOfInterval(assumeNotNull(toDateTime('${formattedStart}')), toIntervalDay(1)), toStartOfInterval(assumeNotNull(toDateTime('${formattedEnd}')), toIntervalDay(1)))), 1))) AS date,
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
            WHERE ${combineFilters(removedFilters)}
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

    const [addedResult, removedResult] = await Promise.all([
      posthogAnalyticsClient.executeHogQL(addedQuery),
      posthogAnalyticsClient.executeHogQL(removedQuery),
    ]);

    const addedData = addedResult as { results?: unknown[][] };
    const removedData = removedResult as { results?: unknown[][] };

    // Parse results
    const addedArray = addedData.results?.[0]?.[1] as number[] | undefined;
    const removedArray = removedData.results?.[0]?.[1] as number[] | undefined;
    const dateArray = addedData.results?.[0]?.[0] as string[] | undefined;

    const starsAdded = addedArray ? addedArray[addedArray.length - 1] || 0 : 0;
    const starsRemoved = removedArray
      ? removedArray[removedArray.length - 1] || 0
      : 0;
    const netStars = starsAdded - starsRemoved;
    const totalStars = netStars;

    // Build time series
    const timeSeries =
      dateArray?.map((date, i) => ({
        date,
        stars: (addedArray?.[i] || 0) - (removedArray?.[i] || 0),
      })) || [];

    return {
      totalStars,
      starsAdded,
      starsRemoved,
      netStars,
      timeSeries,
      timeWindow: {
        startDate,
        endDate,
      },
    };
  } catch (error) {
    throw new ExternalAPIError(
      "PostHog",
      `Error fetching GitHub star metrics: ${(error as Error).message}`
    );
  }
}
