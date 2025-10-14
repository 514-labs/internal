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

interface OSSInstallsCardProps {
  startDate: string;
  endDate: string;
}

const chartConfig = {
  moose: {
    label: "Moose",
    color: "#f97316",
  },
  aurora: {
    label: "Aurora",
    color: "#3b82f6",
  },
  sloan: {
    label: "Sloan",
    color: "#8b5cf6",
  },
  other: {
    label: "Other",
    color: "#64748b",
  },
} satisfies ChartConfig;

export function OSSInstallsCard({ startDate, endDate }: OSSInstallsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["oss-installs", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/metrics/oss-installs?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch OSS install metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OSS Install Metrics</CardTitle>
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
          <CardTitle>OSS Install Metrics</CardTitle>
          <CardDescription className="text-red-500">
            Error loading metrics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = data || {};
  const { totalInstalls = 0, breakdownSeries = [] } = metrics;

  // Transform breakdown series into chart data
  // We need to create a unified data structure with all dates and breakdown values
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cumulative OSS Installs</CardTitle>
        <CardDescription>
          CLI installation script runs by product (cumulative)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total installs */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Installs"
            value={totalInstalls}
            description="All-time cumulative installs"
            trend="up"
          />
          {breakdownSeries.slice(0, 3).map((series: any) => (
            <MetricCard
              key={series.breakdown}
              title={
                series.breakdown.charAt(0).toUpperCase() +
                series.breakdown.slice(1)
              }
              value={series.total}
              description={`${series.breakdown} installs`}
              trend="neutral"
            />
          ))}
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">
              Cumulative Installs Over Time
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
                      day: "numeric",
                    });
                  }}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                {breakdownSeries.map((series: any, index: number) => {
                  const breakdown =
                    series.breakdown as keyof typeof chartConfig;
                  const color =
                    chartConfig[breakdown]?.color ||
                    `var(--color-chart-${(index % 5) + 1})`;
                  return (
                    <Line
                      key={series.breakdown}
                      type="monotone"
                      dataKey={series.breakdown}
                      stroke={color}
                      strokeWidth={2}
                      dot={false}
                      name={chartConfig[breakdown]?.label || series.breakdown}
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
