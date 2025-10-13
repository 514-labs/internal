/**
 * Tests for PostHog product metrics
 */

import {
  getMoosestackInstallMetrics,
  getMoosestackCommandMetrics,
  getBorealDeploymentMetrics,
  getBorealProjectMetrics,
  getGitHubStarMetrics,
} from "@/lib/analytics/posthog/product-metrics";
import { posthogAnalyticsClient } from "@/lib/analytics/posthog/client";

jest.mock("@/lib/analytics/posthog/client");

const mockExecuteHogQL = posthogAnalyticsClient.executeHogQL as jest.MockedFunction<
  typeof posthogAnalyticsClient.executeHogQL
>;

describe("Product Metrics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMoosestackInstallMetrics", () => {
    it("should fetch and parse install metrics", async () => {
      const mockResults = [
        [
          ["2025-01-01", "2025-01-02"],
          [10, 20],
          ["moose"],
        ],
      ];

      mockExecuteHogQL.mockResolvedValue({ results: mockResults });

      const result = await getMoosestackInstallMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalInstalls: expect.any(Number),
        uniqueInstalls: expect.any(Number),
        installsByProduct: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });

      expect(mockExecuteHogQL).toHaveBeenCalled();
    });

    it("should handle empty results", async () => {
      mockExecuteHogQL.mockResolvedValue({ results: [] });

      const result = await getMoosestackInstallMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result.totalInstalls).toBe(0);
      expect(result.installsByProduct).toEqual([]);
    });
  });

  describe("getMoosestackCommandMetrics", () => {
    it("should fetch and parse command metrics", async () => {
      const mockResults = [
        [
          ["2025-01-01", "2025-01-02"],
          [50, 75],
          ["dev"],
        ],
      ];

      mockExecuteHogQL.mockResolvedValue({ results: mockResults });

      const result = await getMoosestackCommandMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalCommands: expect.any(Number),
        topCommands: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });
    });
  });

  describe("getBorealDeploymentMetrics", () => {
    it("should fetch deployment metrics from data warehouse", async () => {
      const deploymentResults = [
        [
          ["2025-01-01", "2025-02-01"],
          [5, 10],
          "org123",
        ],
      ];

      const recentResults = [
        [
          "deploy_1",
          "My Project",
          "https://github.com/user/repo",
          "success",
          "2025-10-13T12:00:00Z",
          "org123",
        ],
      ];

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: deploymentResults })
        .mockResolvedValueOnce({ results: recentResults });

      const result = await getBorealDeploymentMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalDeployments: expect.any(Number),
        deploymentsByOrg: expect.any(Array),
        recentDeployments: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });

      expect(result.recentDeployments).toHaveLength(1);
      expect(result.recentDeployments[0]).toMatchObject({
        deployId: "deploy_1",
        projectName: "My Project",
        status: "success",
      });
    });
  });

  describe("getBorealProjectMetrics", () => {
    it("should fetch project metrics from data warehouse", async () => {
      const mockResults = [
        [
          ["2025-01-01", "2025-02-01"],
          [3, 7],
          "org123",
        ],
      ];

      mockExecuteHogQL.mockResolvedValue({ results: mockResults });

      const result = await getBorealProjectMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalProjects: expect.any(Number),
        projectsByOrg: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });
    });
  });

  describe("getGitHubStarMetrics", () => {
    it("should fetch and calculate star metrics", async () => {
      const addedResults = [
        [
          ["2025-01-01", "2025-01-02", "2025-01-03"],
          [10, 25, 50],
        ],
      ];

      const removedResults = [
        [
          ["2025-01-01", "2025-01-02", "2025-01-03"],
          [2, 5, 8],
        ],
      ];

      mockExecuteHogQL
        .mockResolvedValueOnce({ results: addedResults })
        .mockResolvedValueOnce({ results: removedResults });

      const result = await getGitHubStarMetrics(
        "2025-01-01T00:00:00Z",
        "2025-12-31T23:59:59Z"
      );

      expect(result).toMatchObject({
        totalStars: expect.any(Number),
        starsAdded: 50,
        starsRemoved: 8,
        netStars: 42,
        timeSeries: expect.any(Array),
        timeWindow: {
          startDate: "2025-01-01T00:00:00Z",
          endDate: "2025-12-31T23:59:59Z",
        },
      });

      expect(result.timeSeries).toHaveLength(3);
      expect(result.timeSeries[0].stars).toBe(8); // 10 - 2
    });
  });
});

