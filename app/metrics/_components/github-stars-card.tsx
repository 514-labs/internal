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
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "./metric-card";

interface GitHubStarsCardProps {
  startDate: string;
  endDate: string;
}

const chartConfig = {
  stars: {
    label: "GitHub Stars",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function GitHubStarsCard({
  startDate,
  endDate,
}: GitHubStarsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["github-stars", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "github-stars",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/product-metrics?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch GitHub star metrics");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Stars</CardTitle>
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
          <CardTitle>GitHub Stars</CardTitle>
          <CardDescription className="text-red-500">
            Error loading metrics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stars = data || {
    totalStars: 0,
    starsAdded: 0,
    starsRemoved: 0,
    netStars: 0,
    timeSeries: [],
  };

  const chartData =
    stars.timeSeries?.map((ts: { date: string; stars: number }) => ({
      date: ts.date,
      stars: ts.stars,
    })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Stars</CardTitle>
        <CardDescription>
          Repository star count and growth tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Stars"
            value={stars.totalStars || 0}
            description="Current star count"
            trend={stars.netStars > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Stars Added"
            value={stars.starsAdded || 0}
            description="In period"
            trend="up"
          />
          <MetricCard
            title="Stars Removed"
            value={stars.starsRemoved || 0}
            description="In period"
            trend="down"
          />
          <MetricCard
            title="Net Growth"
            value={stars.netStars || 0}
            description="Added - removed"
            trend={stars.netStars > 0 ? "up" : stars.netStars < 0 ? "down" : "neutral"}
          />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Star Growth (Cumulative)</h4>
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
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
                <Line
                  type="monotone"
                  dataKey="stars"
                  stroke="var(--color-stars)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

