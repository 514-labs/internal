/**
 * Tests for web analytics metrics
 */

import {
  getWebTrafficMetrics,
  getTrafficSourceMetrics,
  getConversionFunnelMetrics,
} from "@/lib/analytics/posthog/web-metrics";
import { posthogAnalyticsClient } from "@/lib/analytics/posthog/client";

jest.mock("@/lib/analytics/posthog/client");

const mockExecuteHogQL =
  posthogAnalyticsClient.executeHogQL as jest.MockedFunction<
    typeof posthogAnalyticsClient.executeHogQL
  >;

describe("Web Analytics Metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getWebTrafficMetrics", () => {
    it("should fetch traffic metrics", async () => {
      const overallResults = [[10000, 2500, 3000]]; // pageviews, visitors, sessions
      const bounceResults = [[500, 3000]]; // bounced, total sessions
      const topPagesResults = [
        ["/home", 5000, 1200],
        ["/about", 3000, 800],
      ];
      const timeSeriesResults = [
        ["2025-01-01", 1000, 250, 300],
        ["2025-01-02", 1200, 280, 320],
      ];

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: overallResults })
        .mockResolvedValueOnce({ results: bounceResults })
        .mockResolvedValueOnce({ results: topPagesResults })
        .mockResolvedValueOnce({ results: timeSeriesResults });

      const result = await getWebTrafficMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalPageViews: 10000,
        uniqueVisitors: 2500,
        totalSessions: 3000,
        bounceRate: expect.any(Number),
        topPages: expect.any(Array),
        timeSeries: expect.any(Array),
      });

      expect(result.topPages).toHaveLength(2);
      expect(result.timeSeries).toHaveLength(2);
    });
  });

  describe("getTrafficSourceMetrics", () => {
    it("should fetch traffic source metrics", async () => {
      const referrerResults = [
        ["google.com", 1000, 0],
        ["twitter.com", 500, 0],
      ];
      const utmResults = [
        ["google", "cpc", "summer-campaign", 800, 0],
        ["facebook", "social", "awareness", 300, 0],
      ];
      const trafficTypeResults = [[2000, 3000, 1100]]; // direct, organic, paid

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: referrerResults })
        .mockResolvedValueOnce({ results: utmResults })
        .mockResolvedValueOnce({ results: trafficTypeResults });

      const result = await getTrafficSourceMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        byReferrer: expect.any(Array),
        byUtmSource: expect.any(Array),
        directTraffic: 2000,
        organicTraffic: 3000,
        paidTraffic: 1100,
      });

      expect(result.byReferrer).toHaveLength(2);
      expect(result.byUtmSource).toHaveLength(2);
    });
  });

  describe("getConversionFunnelMetrics", () => {
    it("should calculate funnel metrics", async () => {
      const stepResults = [
        [[1000]], // step 1
        [[750]], // step 2
        [[500]], // step 3
      ];

      const timeResults = [[180]]; // avg time in seconds

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: stepResults[0] })
        .mockResolvedValueOnce({ results: stepResults[1] })
        .mockResolvedValueOnce({ results: stepResults[2] })
        .mockResolvedValueOnce({ results: timeResults });

      const result = await getConversionFunnelMetrics(
        "Signup Funnel",
        ["landing_view", "signup_start", "signup_complete"],
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        funnelName: "Signup Funnel",
        totalEntered: 1000,
        totalCompleted: 500,
        overallConversionRate: 50,
        averageTimeToConvert: 180,
        steps: expect.any(Array),
      });

      expect(result.steps).toHaveLength(3);
      expect(mockExecuteHogQL).toHaveBeenCalledTimes(4);
    });
  });
});
