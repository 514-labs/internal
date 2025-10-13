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
  // Fetch install metrics
  const { data: installData, isLoading: installLoading } = useQuery({
    queryKey: ["moosestack-installs", startDate, endDate],
    queryFn: async () => {
      console.log("[Frontend] Fetching Moosestack installs...", {
        startDate,
        endDate,
      });
      const params = new URLSearchParams({
        type: "moosestack-installs",
        startDate,
        endDate,
      });
      const url = `/api/analytics/posthog/product-metrics?${params}`;
      console.log("[Frontend] Request URL:", url);

      const response = await fetch(url);
      console.log("[Frontend] Response status:", response.status);

      if (!response.ok) throw new Error("Failed to fetch install metrics");

      const data = await response.json();
      console.log("[Frontend] Install data received:", data);
      return data;
    },
    staleTime: 0, // Disable cache for debugging
    gcTime: 0,
  });

  // Fetch command metrics
  const { data: commandData, isLoading: commandLoading } = useQuery({
    queryKey: ["moosestack-commands", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "moosestack-commands",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/product-metrics?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch command metrics");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = installLoading || commandLoading;
  const error = null; // Simplified error handling

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

  const installs = installData || { totalInstalls: 0, installsByProduct: [] };
  const commands = commandData || { totalCommands: 0, topCommands: [] };

  // Extract chart data from installs
  const chartData =
    installs.installsByProduct?.[0]?.timeSeries?.map(
      (ts: { date: string; installs: number }) => ({
        date: ts.date,
        users: ts.installs,
      })
    ) || [];

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
            title="Total Installs"
            value={installs.totalInstalls || 0}
            description="Unique CLI installs"
            trend={installs.totalInstalls > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Total Commands"
            value={commands.totalCommands || 0}
            description="CLI commands executed"
            trend={commands.totalCommands > 0 ? "up" : "neutral"}
          />
          <MetricCard
            title="Products"
            value={installs.installsByProduct?.length || 0}
            description="Active products"
            trend="neutral"
          />
          <MetricCard
            title="Top Command"
            value={commands.topCommands?.[0]?.command || "N/A"}
            description="Most used command"
            trend="neutral"
          />
        </div>

        {/* Product breakdown */}
        {installs.installsByProduct &&
          installs.installsByProduct.length > 0 && (
            <div className="grid gap-4 md:grid-cols-3">
              {installs.installsByProduct.slice(0, 3).map((product: any) => (
                <MetricCard
                  key={product.product}
                  title={product.product}
                  value={product.installs}
                  description="Installs"
                  trend="neutral"
                />
              ))}
            </div>
          )}

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Install Trend (Cumulative)</h4>
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
