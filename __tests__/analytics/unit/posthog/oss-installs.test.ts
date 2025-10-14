/**
 * Tests for cumulative OSS install metrics
 */

import { getCumulativeOSSInstalls } from "@/lib/analytics/posthog/queries";
import { posthogAnalyticsClient } from "@/lib/analytics/posthog/client";

// Mock the PostHog client
jest.mock("@/lib/analytics/posthog/client");

describe("getCumulativeOSSInstalls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch cumulative OSS install metrics with default options", async () => {
    const mockResults = [
      ["2025-10-01", "moose", 10],
      ["2025-10-02", "moose", 15],
      ["2025-10-01", "aurora", 5],
      ["2025-10-02", "aurora", 8],
      ["2025-10-01", "sloan", 3],
      ["2025-10-02", "sloan", 6],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeOSSInstalls({
      startDate: "2025-10-01T00:00:00.000Z",
      endDate: "2025-10-02T23:59:59.999Z",
    });

    expect(result).toBeDefined();
    expect(result.totalInstalls).toBe(29); // Sum of latest values: 15 + 8 + 6
    expect(result.breakdownSeries).toHaveLength(3);
    expect(result.breakdownSeries[0].breakdown).toBe("moose");
    expect(result.breakdownSeries[0].total).toBe(15);
  });

  it("should handle empty results", async () => {
    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: [],
    });

    const result = await getCumulativeOSSInstalls({
      startDate: "2025-10-01T00:00:00.000Z",
      endDate: "2025-10-02T23:59:59.999Z",
    });

    expect(result).toBeDefined();
    expect(result.totalInstalls).toBe(0);
    expect(result.breakdownSeries).toHaveLength(0);
    expect(result.dataPoints).toHaveLength(0);
  });

  it("should support custom breakdown property", async () => {
    const mockResults = [
      ["2025-10-01", "custom-value", 10],
      ["2025-10-02", "custom-value", 20],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeOSSInstalls(
      {
        startDate: "2025-10-01T00:00:00.000Z",
        endDate: "2025-10-02T23:59:59.999Z",
      },
      {
        breakdownProperty: "custom_property",
      }
    );

    expect(result).toBeDefined();
    expect(posthogAnalyticsClient.executeHogQL).toHaveBeenCalledWith(
      expect.stringContaining("custom_property")
    );
  });

  it("should support custom products filter", async () => {
    const mockResults = [
      ["2025-10-01", "product1", 10],
      ["2025-10-02", "product1", 20],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeOSSInstalls(
      {
        startDate: "2025-10-01T00:00:00.000Z",
        endDate: "2025-10-02T23:59:59.999Z",
      },
      {
        products: ["product1", "product2"],
      }
    );

    expect(result).toBeDefined();
    expect(posthogAnalyticsClient.executeHogQL).toHaveBeenCalledWith(
      expect.stringContaining("'product1', 'product2'")
    );
  });

  it("should include developer filters by default", async () => {
    const mockResults = [["2025-10-01", "moose", 10]];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    await getCumulativeOSSInstalls({
      startDate: "2025-10-01T00:00:00.000Z",
      endDate: "2025-10-02T23:59:59.999Z",
    });

    const query = (posthogAnalyticsClient.executeHogQL as jest.Mock).mock
      .calls[0][0];
    expect(query).toContain("notEquals(properties.is_moose_developer, true)");
    expect(query).toContain("notEquals(properties.is_developer, true)");
  });

  it("should exclude developer filters when specified", async () => {
    const mockResults = [["2025-10-01", "moose", 10]];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    await getCumulativeOSSInstalls(
      {
        startDate: "2025-10-01T00:00:00.000Z",
        endDate: "2025-10-02T23:59:59.999Z",
      },
      {
        excludeDevelopers: false,
      }
    );

    const query = (posthogAnalyticsClient.executeHogQL as jest.Mock).mock
      .calls[0][0];
    expect(query).not.toContain("is_moose_developer");
    expect(query).not.toContain("is_developer");
  });

  it("should sort breakdown series by total descending", async () => {
    const mockResults = [
      ["2025-10-01", "moose", 5],
      ["2025-10-02", "moose", 10],
      ["2025-10-01", "aurora", 15],
      ["2025-10-02", "aurora", 30],
      ["2025-10-01", "sloan", 10],
      ["2025-10-02", "sloan", 20],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeOSSInstalls({
      startDate: "2025-10-01T00:00:00.000Z",
      endDate: "2025-10-02T23:59:59.999Z",
    });

    expect(result.breakdownSeries[0].breakdown).toBe("aurora");
    expect(result.breakdownSeries[0].total).toBe(30);
    expect(result.breakdownSeries[1].breakdown).toBe("sloan");
    expect(result.breakdownSeries[1].total).toBe(20);
    expect(result.breakdownSeries[2].breakdown).toBe("moose");
    expect(result.breakdownSeries[2].total).toBe(10);
  });
});
