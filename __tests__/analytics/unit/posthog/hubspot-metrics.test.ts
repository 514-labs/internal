/**
 * Tests for HubSpot GTM metrics
 */

import {
  getLeadGenerationMetrics,
  getSalesPipelineMetrics,
  getCustomerLifecycleMetrics,
} from "@/lib/analytics/posthog/hubspot-metrics";
import { posthogAnalyticsClient } from "@/lib/analytics/posthog/client";

jest.mock("@/lib/analytics/posthog/client");

const mockExecuteHogQL = posthogAnalyticsClient.executeHogQL as jest.MockedFunction<
  typeof posthogAnalyticsClient.executeHogQL
>;

describe("HubSpot GTM Metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getLeadGenerationMetrics", () => {
    it("should fetch and calculate lead metrics", async () => {
      const contactsResults = [[1000, 150]]; // total, new
      const qualifiedResults = [[50, 25]]; // mqls, sqls
      const stageResults = [
        ["subscriber", 500],
        ["lead", 300],
        ["marketingqualifiedlead", 50],
      ];
      const timeSeriesResults = [
        ["2025-01-01", 100, 10, 5],
        ["2025-02-01", 120, 12, 6],
      ];

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: contactsResults })
        .mockResolvedValueOnce({ results: qualifiedResults })
        .mockResolvedValueOnce({ results: stageResults })
        .mockResolvedValueOnce({ results: timeSeriesResults });

      const result = await getLeadGenerationMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalContacts: 1000,
        newContacts: 150,
        mqls: 50,
        sqls: 25,
        contactToLeadRate: expect.any(Number),
        leadVelocity: expect.any(Number),
        byLifecycleStage: expect.arrayContaining([
          { stage: "subscriber", count: 500 },
        ]),
        timeSeries: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });

      expect(result.timeSeries).toHaveLength(2);
      expect(mockExecuteHogQL).toHaveBeenCalledTimes(4);
    });
  });

  describe("getSalesPipelineMetrics", () => {
    it("should fetch and calculate sales metrics", async () => {
      const dealsByStageResults = [
        ["awareness", 10, 50000],
        ["exploration", 7, 35000],
        ["selection", 5, 25000],
        ["closedwon", 3, 15000],
      ];

      const winRateResults = [[3, 25]]; // won, total
      const salesCycleResults = [[45]]; // avg days

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: dealsByStageResults })
        .mockResolvedValueOnce({ results: winRateResults })
        .mockResolvedValueOnce({ results: salesCycleResults });

      const result = await getSalesPipelineMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalDeals: 25, // sum of all stages
        pipelineValue: 125000, // sum of all values
        averageDealSize: 5000, // 125000 / 25
        winRate: 12, // 3/25 * 100
        averageSalesCycle: 45,
        dealsByStage: expect.arrayContaining([
          { stage: "awareness", count: 10, value: 50000 },
        ]),
        conversionRates: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });

      expect(result.dealsByStage).toHaveLength(4);
      expect(result.conversionRates).toHaveLength(3); // 4 stages - 1
    });
  });

  describe("getCustomerLifecycleMetrics", () => {
    it("should fetch lifecycle distribution", async () => {
      const stageResults = [
        ["subscriber", 500],
        ["lead", 300],
        ["customer", 100],
      ];

      const churnResults = [[20, 500]]; // churned, total

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: stageResults })
        .mockResolvedValueOnce({ results: churnResults });

      const result = await getCustomerLifecycleMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        stageDistribution: expect.arrayContaining([
          {
            stage: "subscriber",
            count: 500,
            percentage: expect.any(Number),
          },
        ]),
        churnRate: 4, // 20/500 * 100
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });

      expect(result.stageDistribution).toHaveLength(3);
    });
  });
});

