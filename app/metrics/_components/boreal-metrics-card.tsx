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
  // Fetch deployment metrics
  const { data: deploymentData, isLoading: deploymentLoading } = useQuery({
    queryKey: ["boreal-deployments", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "boreal-deployments",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/product-metrics?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch deployment metrics");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch project metrics
  const { data: projectData, isLoading: projectLoading } = useQuery({
    queryKey: ["boreal-projects", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "boreal-projects",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/product-metrics?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch project metrics");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = deploymentLoading || projectLoading;
  const error = null; // Simplified error handling

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

  const deployments = deploymentData || {
    totalDeployments: 0,
    deploymentsByOrg: [],
    recentDeployments: [],
  };
  const projects = projectData || { totalProjects: 0, projectsByOrg: [] };

  // Extract chart data from deployments
  const chartData =
    deployments.deploymentsByOrg?.[0]?.timeSeries?.map(
      (ts: { date: string; deployments: number }) => ({
        date: ts.date,
        users: ts.deployments,
      })
    ) || [];

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
            title="Total Deployments"
            value={deployments.totalDeployments || 0}
            description="All deployments"
            trend={deployments.totalDeployments > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Total Projects"
            value={projects.totalProjects || 0}
            description="Created projects"
            trend={projects.totalProjects > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Active Orgs"
            value={deployments.deploymentsByOrg?.length || 0}
            description="Organizations deploying"
            trend="neutral"
          />
          <MetricCard
            title="Recent"
            value={deployments.recentDeployments?.length || 0}
            description="Recent deployments"
            trend="neutral"
          />
        </div>

        {/* Top orgs by deployments */}
        {deployments.deploymentsByOrg &&
          deployments.deploymentsByOrg.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {deployments.deploymentsByOrg.slice(0, 3).map((org: any) => (
                <MetricCard
                  key={org.orgId}
                  title={org.orgId}
                  value={org.deployments}
                  description="Deployments"
                  trend="neutral"
                />
              ))}
            </div>
          )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Deployment Trend (Cumulative)</h4>
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
