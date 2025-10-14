/**
 * Tests for cumulative projects metrics
 */

import { getCumulativeProjects } from "@/lib/analytics/posthog/queries";
import { posthogAnalyticsClient } from "@/lib/analytics/posthog/client";

// Mock the PostHog client
jest.mock("@/lib/analytics/posthog/client");

describe("getCumulativeProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch cumulative projects metrics with default options", async () => {
    const mockResults = [
      ["2024-10-01", "org-123", 5],
      ["2024-11-01", "org-123", 12],
      ["2024-10-01", "org-456", 3],
      ["2024-11-01", "org-456", 8],
      ["2024-10-01", "org-789", 2],
      ["2024-11-01", "org-789", 7],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeProjects({
      startDate: "2024-10-01T00:00:00.000Z",
      endDate: "2024-11-30T23:59:59.999Z",
    });

    expect(result).toBeDefined();
    expect(result.totalProjects).toBe(27); // Sum of latest values: 12 + 8 + 7
    expect(result.totalOrganizations).toBe(3);
    expect(result.breakdownSeries).toHaveLength(3);
    expect(result.breakdownSeries[0].breakdown).toBe("org-123");
    expect(result.breakdownSeries[0].total).toBe(12);
  });

  it("should handle empty results", async () => {
    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: [],
    });

    const result = await getCumulativeProjects({
      startDate: "2024-10-01T00:00:00.000Z",
      endDate: "2024-11-30T23:59:59.999Z",
    });

    expect(result).toBeDefined();
    expect(result.totalProjects).toBe(0);
    expect(result.totalOrganizations).toBe(0);
    expect(result.breakdownSeries).toHaveLength(0);
    expect(result.dataPoints).toHaveLength(0);
  });

  it("should support custom breakdown property", async () => {
    const mockResults = [
      ["2024-10-01", "custom-id", 10],
      ["2024-11-01", "custom-id", 20],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeProjects(
      {
        startDate: "2024-10-01T00:00:00.000Z",
        endDate: "2024-11-30T23:59:59.999Z",
      },
      {
        breakdownProperty: "custom_org_id",
      }
    );

    expect(result).toBeDefined();
    expect(posthogAnalyticsClient.executeHogQL).toHaveBeenCalledWith(
      expect.stringContaining("custom_org_id")
    );
  });

  it("should support different interval units", async () => {
    const mockResults = [["2024-10-01", "org-123", 10]];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    await getCumulativeProjects(
      {
        startDate: "2024-10-01T00:00:00.000Z",
        endDate: "2024-11-30T23:59:59.999Z",
      },
      {
        intervalUnit: "week",
      }
    );

    const query = (posthogAnalyticsClient.executeHogQL as jest.Mock).mock
      .calls[0][0];
    expect(query).toContain("toStartOfWeek");
  });

  it("should limit results to topN organizations", async () => {
    const mockResults = [];
    for (let i = 0; i < 30; i++) {
      mockResults.push(["2024-10-01", `org-${i}`, i + 1]);
      mockResults.push(["2024-11-01", `org-${i}`, (i + 1) * 2]);
    }

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeProjects(
      {
        startDate: "2024-10-01T00:00:00.000Z",
        endDate: "2024-11-30T23:59:59.999Z",
      },
      {
        topN: 10,
      }
    );

    expect(result).toBeDefined();
    // Should have 10 top orgs + 1 "other" category
    expect(result.breakdownSeries.length).toBeLessThanOrEqual(11);

    // Check if "other" category exists
    const hasOther = result.breakdownSeries.some(
      (s) => s.breakdown === "other"
    );
    expect(hasOther).toBe(true);
  });

  it("should sort breakdown series by total descending", async () => {
    const mockResults = [
      ["2024-10-01", "org-a", 5],
      ["2024-11-01", "org-a", 10],
      ["2024-10-01", "org-b", 15],
      ["2024-11-01", "org-b", 30],
      ["2024-10-01", "org-c", 10],
      ["2024-11-01", "org-c", 20],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeProjects({
      startDate: "2024-10-01T00:00:00.000Z",
      endDate: "2024-11-30T23:59:59.999Z",
    });

    expect(result.breakdownSeries[0].breakdown).toBe("org-b");
    expect(result.breakdownSeries[0].total).toBe(30);
    expect(result.breakdownSeries[1].breakdown).toBe("org-c");
    expect(result.breakdownSeries[1].total).toBe(20);
    expect(result.breakdownSeries[2].breakdown).toBe("org-a");
    expect(result.breakdownSeries[2].total).toBe(10);
  });

  it("should exclude unknown organizations from count", async () => {
    const mockResults = [
      ["2024-10-01", "org-123", 10],
      ["2024-11-01", "org-123", 20],
      ["2024-10-01", "unknown", 5],
      ["2024-11-01", "unknown", 10],
    ];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    const result = await getCumulativeProjects({
      startDate: "2024-10-01T00:00:00.000Z",
      endDate: "2024-11-30T23:59:59.999Z",
    });

    expect(result.totalProjects).toBe(30); // 20 + 10
    expect(result.totalOrganizations).toBe(1); // Only org-123 (unknown excluded)
  });

  it("should use month as default interval unit", async () => {
    const mockResults = [["2024-10-01", "org-123", 10]];

    (posthogAnalyticsClient.executeHogQL as jest.Mock).mockResolvedValue({
      results: mockResults,
    });

    await getCumulativeProjects({
      startDate: "2024-10-01T00:00:00.000Z",
      endDate: "2024-11-30T23:59:59.999Z",
    });

    const query = (posthogAnalyticsClient.executeHogQL as jest.Mock).mock
      .calls[0][0];
    expect(query).toContain("toStartOfMonth");
  });
});
