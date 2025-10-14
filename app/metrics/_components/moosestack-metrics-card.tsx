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

interface MoosestackMetricsCardProps {
  startDate: string;
  endDate: string;
}

const chartConfig = {
  users: {
    label: "Daily Active Users",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function MoosestackMetricsCard({
  startDate,
  endDate,
}: MoosestackMetricsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["moosestack-metrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        product: "moosestack",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/metrics/product?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Moosestack metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moosestack (Framework)</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
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
          <CardTitle>Moosestack (Framework)</CardTitle>
          <CardDescription className="text-red-500">
            Error loading metrics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = data || {};
  const {
    dau = 0,
    mau = 0,
    conversionRate = 0,
    engagementScore = 0,
    specificMetrics = {},
    chartData = [],
    githubStars,
  } = metrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Moosestack (Framework)</CardTitle>
        <CardDescription>
          Open source framework metrics and adoption
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key metrics grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="DAU"
            value={Math.round(dau)}
            description="Daily Active Users"
            trend={dau > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="MAU"
            value={Math.round(mau)}
            description="Monthly Active Users"
            trend={mau > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Conversion Rate"
            value={conversionRate.toFixed(1)}
            unit="%"
            description="To production builds"
            trend={conversionRate > 50 ? "up" : "neutral"}
          />
          <MetricCard
            title="Engagement"
            value={engagementScore.toFixed(1)}
            description="Events per user"
            trend={engagementScore > 5 ? "up" : "neutral"}
          />
        </div>

        {/* Product-specific metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          {githubStars && (
            <MetricCard
              title="GitHub Stars"
              value={githubStars.current || 0}
              description="Repository stars"
              trend={githubStars.current > 0 ? "up" : "neutral"}
            />
          )}
          <MetricCard
            title="Installs"
            value={specificMetrics.installs || 0}
            description="Framework installations"
            trend="neutral"
          />
          <MetricCard
            title="Doc Views"
            value={specificMetrics.docViews || 0}
            description="Documentation reads"
            trend="neutral"
          />
          <MetricCard
            title="Builds"
            value={specificMetrics.builds || 0}
            description="Total builds executed"
            trend="neutral"
          />
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Daily Active Users Trend</h4>
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
                  dataKey="users"
                  stroke="var(--color-users)"
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
