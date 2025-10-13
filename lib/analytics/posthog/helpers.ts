/**
 * PostHog HogQL query helper functions
 * Time series aggregation and result transformation utilities
 */

export type TimeInterval = "day" | "week" | "month";
export type AggregationType = "cumulative" | "direct";

/**
 * Build date array generation clause for HogQL
 */
export function buildDateArrayClause(
  startDate: string,
  endDate: string,
  interval: TimeInterval = "day"
): string {
  const intervalFunc =
    interval === "day"
      ? "toIntervalDay"
      : interval === "week"
        ? "toIntervalWeek"
        : "toIntervalMonth";

  const startOfFunc =
    interval === "day"
      ? "toStartOfInterval"
      : interval === "week"
        ? "toStartOfWeek"
        : "toStartOfInterval";

  const dateDiffInterval = interval === "month" ? "month" : interval;

  return `arrayMap(number -> plus(${startOfFunc}(assumeNotNull(toDateTime('${startDate}')), ${intervalFunc}(1)), ${intervalFunc}(number)), range(0, plus(coalesce(dateDiff('${dateDiffInterval}', ${startOfFunc}(assumeNotNull(toDateTime('${startDate}')), ${intervalFunc}(1)), ${startOfFunc}(assumeNotNull(toDateTime('${endDate}')), ${intervalFunc}(1)))), 1)))`;
}

/**
 * Build cumulative time series aggregation using arrayFill pattern
 */
export function buildCumulativeTimeSeriesClause(dateArrayAlias: string): string {
  return `arrayFill(x -> greater(x, 0), arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), ${dateArrayAlias}))`;
}

/**
 * Build direct (non-cumulative) time series aggregation
 */
export function buildDirectTimeSeriesClause(dateArrayAlias: string): string {
  return `arrayMap(_match_date -> arraySum(arraySlice(groupArray(ifNull(count, 0)), indexOf(groupArray(day_start) AS _days_for_count, _match_date) AS _index, plus(minus(arrayLastIndex(x -> equals(x, _match_date), _days_for_count), _index), 1))), ${dateArrayAlias})`;
}

/**
 * Build breakdown ordering clause for HogQL
 * Handles special breakdown values (null and other)
 */
export function buildBreakdownOrderingClause(
  breakdownField: string = "breakdown_value",
  maxBreakdowns: number = 25
): string {
  return `if(has(${breakdownField}, '$$_posthog_breakdown_other_$$'), 2, if(has(${breakdownField}, '$$_posthog_breakdown_null_$$'), 1, 0))`;
}

/**
 * Build breakdown limiting clause
 * Limits to top N breakdowns, groups rest as "other"
 */
export function buildBreakdownLimitClause(
  maxBreakdowns: number = 25,
  isArray: boolean = true
): string {
  if (isArray) {
    return `arrayMap(i -> if(ifNull(greaterOrEquals(row_number, ${maxBreakdowns}), 0), '$$_posthog_breakdown_other_$$', i), breakdown_value)`;
  }
  return `if(ifNull(greaterOrEquals(row_number, ${maxBreakdowns}), 0), '$$_posthog_breakdown_other_$$', breakdown_value)`;
}

/**
 * Build window function for cumulative count
 */
export function buildCumulativeWindowFunction(
  partitionBy?: string
): string {
  if (partitionBy) {
    return `sum(count) OVER (PARTITION BY ${partitionBy} ORDER BY day_start ASC)`;
  }
  return `sum(count) OVER (ORDER BY day_start ASC)`;
}

/**
 * Build null-safe breakdown value clause
 */
export function buildBreakdownValueClause(
  field: string,
  useArray: boolean = true
): string {
  const nullSafeField = `ifNull(nullIf(toString(${field}), ''), '$$_posthog_breakdown_null_$$')`;
  return useArray ? `[${nullSafeField}]` : nullSafeField;
}

/**
 * Parse cumulative time series results from HogQL
 */
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  breakdown?: string;
}

export function parseCumulativeResults(
  results: unknown[][]
): TimeSeriesDataPoint[] {
  if (!results || results.length === 0) return [];

  const dataPoints: TimeSeriesDataPoint[] = [];

  for (const row of results) {
    const dates = row[0] as string[];
    const values = row[1] as number[];
    const breakdown = row[2] as string | string[] | undefined;

    // Handle array breakdown values
    const breakdownStr = Array.isArray(breakdown)
      ? breakdown[0]
      : (breakdown as string);

    if (dates && values && Array.isArray(dates) && Array.isArray(values)) {
      for (let i = 0; i < dates.length; i++) {
        dataPoints.push({
          date: dates[i],
          value: values[i] || 0,
          breakdown: breakdownStr || undefined,
        });
      }
    }
  }

  return dataPoints;
}

/**
 * Parse breakdown results from HogQL
 */
export interface BreakdownDataPoint {
  breakdown: string;
  value: number;
  timeSeries?: { date: string; value: number }[];
}

export function parseBreakdownResults(
  results: unknown[][]
): BreakdownDataPoint[] {
  if (!results || results.length === 0) return [];

  const dataPoints: BreakdownDataPoint[] = [];

  for (const row of results) {
    // Handle different result structures
    if (row.length >= 2) {
      const dates = row[0] as string[] | string;
      const values = row[1] as number[] | number;
      const breakdown = row[2] as string | string[] | undefined;

      const breakdownStr = Array.isArray(breakdown)
        ? breakdown[0]
        : (breakdown as string);

      // If dates and values are arrays, it's a time series
      if (Array.isArray(dates) && Array.isArray(values)) {
        const timeSeries = dates.map((date, i) => ({
          date,
          value: values[i] || 0,
        }));

        dataPoints.push({
          breakdown: breakdownStr || "unknown",
          value: values.reduce((sum, v) => sum + (v || 0), 0),
          timeSeries,
        });
      } else {
        // Simple aggregation
        dataPoints.push({
          breakdown: breakdownStr || "unknown",
          value: typeof values === "number" ? values : 0,
        });
      }
    }
  }

  return dataPoints;
}

/**
 * Flatten time series data for chart consumption
 */
export interface ChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export function flattenTimeSeriesData(
  dataPoints: TimeSeriesDataPoint[]
): ChartDataPoint[] {
  const dateMap = new Map<string, ChartDataPoint>();

  for (const point of dataPoints) {
    const existing = dateMap.get(point.date) || { date: point.date };

    if (point.breakdown) {
      existing[point.breakdown] = point.value;
    } else {
      existing.value = point.value;
    }

    dateMap.set(point.date, existing);
  }

  return Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Transform breakdown data for chart consumption
 */
export function transformBreakdownForChart(
  dataPoints: BreakdownDataPoint[]
): Array<{ name: string; value: number }> {
  return dataPoints
    .map((point) => ({
      name: point.breakdown.replace("$$_posthog_breakdown_null_$$", "Unknown"),
      value: point.value,
    }))
    .filter((point) => point.name !== "$$_posthog_breakdown_other_$$")
    .sort((a, b) => b.value - a.value);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate growth rate over time series
 */
export function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return calculatePercentageChange(last, first);
}

/**
 * Aggregate time series by period
 */
export function aggregateByPeriod(
  dataPoints: TimeSeriesDataPoint[],
  period: "day" | "week" | "month"
): TimeSeriesDataPoint[] {
  const periodMap = new Map<string, number>();

  for (const point of dataPoints) {
    const date = new Date(point.date);
    let key: string;

    if (period === "day") {
      key = date.toISOString().split("T")[0];
    } else if (period === "week") {
      // Get start of week
      const dayOfWeek = date.getUTCDay();
      const diff = date.getUTCDate() - dayOfWeek;
      const weekStart = new Date(date);
      weekStart.setUTCDate(diff);
      key = weekStart.toISOString().split("T")[0];
    } else {
      // month
      key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
    }

    periodMap.set(key, (periodMap.get(key) || 0) + point.value);
  }

  return Array.from(periodMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

