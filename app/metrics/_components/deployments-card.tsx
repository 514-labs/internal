"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "./metric-card";

interface DeploymentsCardProps {
  startDate: string;
  endDate: string;
}

// Generate colors for top organizations
const generateColors = (count: number): string[] => {
  const colors = [
    "#10b981", // green
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
    "#6366f1", // indigo
    "#ef4444", // red
  ];

  // Cycle through colors if we have more series than colors
  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

export function DeploymentsCard({ startDate, endDate }: DeploymentsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["deployments-metrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        intervalUnit: "month",
        topN: "10",
      });
      const response = await fetch(
        `/api/analytics/posthog/metrics/deployments?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch deployments metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployments Per Organization</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Deployments Per Organization</CardTitle>
          <CardDescription className="text-red-500">
            Error loading metrics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = data || {};
  const {
    totalDeployments = 0,
    totalOrganizations = 0,
    breakdownSeries = [],
  } = metrics;

  // Transform breakdown series into chart data
  const chartData: Record<string, any>[] = [];
  const dateSet = new Set<string>();

  // Collect all dates
  breakdownSeries.forEach((series: any) => {
    series.dataPoints.forEach((point: any) => {
      dateSet.add(point.date);
    });
  });

  // Create data points for each date
  const sortedDates = Array.from(dateSet).sort();
  sortedDates.forEach((date) => {
    const dataPoint: Record<string, any> = { date };

    breakdownSeries.forEach((series: any) => {
      const point = series.dataPoints.find((p: any) => p.date === date);
      dataPoint[series.breakdown] = point?.cumulativeTotal || 0;
    });

    chartData.push(dataPoint);
  });

  // Generate chart config dynamically based on breakdown series
  const colors = generateColors(breakdownSeries.length);
  const chartConfig: ChartConfig = {};

  breakdownSeries.forEach((series: any, index: number) => {
    chartConfig[series.breakdown] = {
      label:
        series.breakdown === "other"
          ? "Other Organizations"
          : `Org ${series.breakdown.slice(0, 8)}`,
      color: colors[index],
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative Deployments</CardTitle>
        <CardDescription>Deployments over time by organization</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Total Deployments"
            value={totalDeployments}
            description="All-time cumulative deployments"
            trend="up"
          />
          <MetricCard
            title="Organizations"
            value={totalOrganizations}
            description="Unique organizations"
            trend="neutral"
          />
          <MetricCard
            title="Avg per Org"
            value={
              totalOrganizations > 0
                ? Math.round(totalDeployments / totalOrganizations)
                : 0
            }
            description="Deployments per organization"
            trend="neutral"
          />
        </div>

        {/* Top organizations */}
        {breakdownSeries.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">
              Top Organizations by Deployments
            </h4>
            <div className="grid gap-2">
              {breakdownSeries.slice(0, 5).map((series: any) => (
                <div
                  key={series.breakdown}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                >
                  <span className="text-sm font-medium">
                    {series.breakdown === "other"
                      ? "Other Organizations"
                      : `Org ${series.breakdown.slice(0, 12)}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {series.total} deployments
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Cumulative Deployments Over Time
            </h4>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      year: "2-digit",
                    });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {breakdownSeries.map((series: any, index: number) => {
                  const color = colors[index];
                  return (
                    <Line
                      key={series.breakdown}
                      type="monotone"
                      dataKey={series.breakdown}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      name={
                        chartConfig[series.breakdown]?.label || series.breakdown
                      }
                    />
                  );
                })}
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
