/**
 * Tests for PostHog helper utilities
 */

import {
  buildDateArrayClause,
  buildCumulativeTimeSeriesClause,
  buildBreakdownOrderingClause,
  parseCumulativeResults,
  parseBreakdownResults,
  flattenTimeSeriesData,
  calculatePercentageChange,
  calculateGrowthRate,
} from "@/lib/analytics/posthog/helpers";

describe("PostHog Helper Utilities", () => {
  describe("buildDateArrayClause", () => {
    it("should build daily date array clause", () => {
      const result = buildDateArrayClause(
        "2025-01-01 00:00:00",
        "2025-01-31 23:59:59",
        "day"
      );

      expect(result).toContain("toStartOfInterval");
      expect(result).toContain("toIntervalDay");
      expect(result).toContain("dateDiff");
    });

    it("should build weekly date array clause", () => {
      const result = buildDateArrayClause(
        "2025-01-01 00:00:00",
        "2025-12-31 23:59:59",
        "week"
      );

      expect(result).toContain("toStartOfWeek");
      expect(result).toContain("toIntervalWeek");
    });

    it("should build monthly date array clause", () => {
      const result = buildDateArrayClause(
        "2025-01-01 00:00:00",
        "2025-12-31 23:59:59",
        "month"
      );

      expect(result).toContain("toIntervalMonth");
    });
  });

  describe("buildCumulativeTimeSeriesClause", () => {
    it("should build cumulative aggregation clause", () => {
      const result = buildCumulativeTimeSeriesClause("date");

      expect(result).toContain("arrayFill");
      expect(result).toContain("arrayMap");
      expect(result).toContain("date");
    });
  });

  describe("buildBreakdownOrderingClause", () => {
    it("should build breakdown ordering clause", () => {
      const result = buildBreakdownOrderingClause("breakdown_value", 25);

      expect(result).toContain("$$_posthog_breakdown_other_$$");
      expect(result).toContain("$$_posthog_breakdown_null_$$");
      expect(result).toContain("breakdown_value");
    });
  });

  describe("parseCumulativeResults", () => {
    it("should parse cumulative results correctly", () => {
      const mockResults = [
        [
          ["2025-01-01", "2025-01-02", "2025-01-03"],
          [10, 20, 30],
          ["moose"],
        ],
        [["2025-01-01", "2025-01-02", "2025-01-03"], [5, 15, 25], ["aurora"]],
      ];

      const result = parseCumulativeResults(mockResults);

      expect(result).toHaveLength(6); // 3 dates × 2 breakdowns
      expect(result[0]).toEqual({
        date: "2025-01-01",
        value: 10,
        breakdown: "moose",
      });
      expect(result[3]).toEqual({
        date: "2025-01-01",
        value: 5,
        breakdown: "aurora",
      });
    });

    it("should handle empty results", () => {
      const result = parseCumulativeResults([]);

      expect(result).toEqual([]);
    });
  });

  describe("parseBreakdownResults", () => {
    it("should parse breakdown results with time series", () => {
      const mockResults = [
        [
          ["2025-01-01", "2025-01-02"],
          [10, 20],
          ["moose"],
        ],
      ];

      const result = parseBreakdownResults(mockResults);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        breakdown: "moose",
        value: 30, // sum of values
      });
      expect(result[0].timeSeries).toHaveLength(2);
    });

    it("should handle simple aggregation", () => {
      const mockResults = [["moose", 50, ["moose"]]];

      const result = parseBreakdownResults(mockResults);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        breakdown: "moose",
        value: 0,
      });
    });
  });

  describe("flattenTimeSeriesData", () => {
    it("should flatten time series data for charts", () => {
      const dataPoints = [
        { date: "2025-01-01", value: 10, breakdown: "moose" },
        { date: "2025-01-01", value: 5, breakdown: "aurora" },
        { date: "2025-01-02", value: 20, breakdown: "moose" },
        { date: "2025-01-02", value: 15, breakdown: "aurora" },
      ];

      const result = flattenTimeSeriesData(dataPoints);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: "2025-01-01",
        moose: 10,
        aurora: 5,
      });
      expect(result[1]).toEqual({
        date: "2025-01-02",
        moose: 20,
        aurora: 15,
      });
    });
  });

  describe("calculatePercentageChange", () => {
    it("should calculate positive percentage change", () => {
      const result = calculatePercentageChange(150, 100);

      expect(result).toBe(50);
    });

    it("should calculate negative percentage change", () => {
      const result = calculatePercentageChange(75, 100);

      expect(result).toBe(-25);
    });

    it("should handle zero previous value", () => {
      const result = calculatePercentageChange(50, 0);

      expect(result).toBe(100);
    });
  });

  describe("calculateGrowthRate", () => {
    it("should calculate growth rate over series", () => {
      const values = [100, 150, 200];
      const result = calculateGrowthRate(values);

      expect(result).toBe(100); // 100% growth from 100 to 200
    });

    it("should handle empty or single value", () => {
      expect(calculateGrowthRate([])).toBe(0);
      expect(calculateGrowthRate([100])).toBe(0);
    });
  });
});

