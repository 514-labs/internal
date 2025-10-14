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
import { CompactDeploymentsCard } from "./compact-deployments-card";
import { CompactProjectsCard } from "./compact-projects-card";

interface BorealMetricsCardProps {
  startDate: string;
  endDate: string;
}

const chartConfig = {
  users: {
    label: "Daily Active Users",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function BorealMetricsCard({
  startDate,
  endDate,
}: BorealMetricsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["boreal-metrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        product: "boreal",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/metrics/product?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Boreal metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Boreal (Hosting Service)</CardTitle>
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
          <CardTitle>Boreal (Hosting Service)</CardTitle>
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
  } = metrics;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Boreal (Hosting Service)</CardTitle>
        <CardDescription>Hosting platform metrics and usage</CardDescription>
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
            description="To production usage"
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
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard
            title="Deployments"
            value={specificMetrics.deployments || 0}
            description="Total deployments in period"
            trend="neutral"
          />
          <MetricCard
            title="Active Projects"
            value={specificMetrics.activeProjects || 0}
            description="Projects with activity"
            trend="neutral"
          />
        </div>

        {/* Compact interactive cards */}
        <div className="grid gap-4 lg:grid-cols-2">
          <CompactProjectsCard startDate={startDate} endDate={endDate} />
          <CompactDeploymentsCard startDate={startDate} endDate={endDate} />
        </div>
      </CardContent>
    </Card>
  );
}
