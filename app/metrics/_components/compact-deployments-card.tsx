"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, Line, LineChart, XAxis } from "recharts";
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

interface CompactDeploymentsCardProps {
  startDate: string;
  endDate: string;
}

export function CompactDeploymentsCard({
  startDate,
  endDate,
}: CompactDeploymentsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["deployments-metrics-compact", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        intervalUnit: "month",
        topN: "5",
      });
      const response = await fetch(
        `/api/analytics/posthog/metrics/deployments?${params}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch deployments metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const [activeOrg, setActiveOrg] = React.useState<string>("total");

  const metrics = data || {};
  const { totalDeployments = 0, breakdownSeries = [] } = metrics;

  // Generate chart config dynamically
  const chartConfig: ChartConfig = {
    total: {
      label: "Total Deployments",
      color: "var(--chart-1)",
    },
  };

  breakdownSeries.forEach((series: any, index: number) => {
    const colors = [
      "--chart-2",
      "--chart-3",
      "--chart-4",
      "--chart-5",
      "--chart-1",
    ];
    chartConfig[series.breakdown] = {
      label:
        series.breakdown === "other"
          ? "Other Orgs"
          : `Org ${series.breakdown.slice(0, 8)}`,
      color: `var(${colors[index % colors.length]})`,
    };
  });

  // Transform data for chart
  const chartData = React.useMemo(() => {
    if (activeOrg === "total") {
      // Aggregate all organizations
      const dateMap = new Map<string, number>();
      breakdownSeries.forEach((series: any) => {
        series.dataPoints.forEach((point: any) => {
          const current = dateMap.get(point.date) || 0;
          dateMap.set(point.date, Math.max(current, point.cumulativeTotal));
        });
      });
      return Array.from(dateMap.entries())
        .map(([date, deployments]) => ({ date, deployments }))
        .sort((a, b) => a.date.localeCompare(b.date));
    }

    const activeSeries = breakdownSeries.find(
      (s: any) => s.breakdown === activeOrg
    );

    if (!activeSeries) return [];

    return activeSeries.dataPoints.map((point: any) => ({
      date: point.date,
      deployments: point.cumulativeTotal,
    }));
  }, [activeOrg, breakdownSeries]);

  if (isLoading) {
    return (
      <Card className="py-4 sm:py-0">
        <CardHeader className="px-6 pb-3">
          <CardTitle>Deployments</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || breakdownSeries.length === 0) {
    return (
      <Card className="py-4 sm:py-0">
        <CardHeader className="px-6 pb-3">
          <CardTitle>Deployments</CardTitle>
          <CardDescription className="text-red-500">
            {error ? "Error loading data" : "No data available"}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="py-4 sm:py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pb-3 sm:pb-0 sm:py-6">
          <CardTitle>Deployments</CardTitle>
          <CardDescription>Cumulative by organization</CardDescription>
        </div>
        <div className="flex overflow-x-auto">
          <button
            data-active={activeOrg === "total"}
            className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-4 text-left sm:border-t-0 sm:border-l sm:px-6 sm:py-6 whitespace-nowrap min-w-[100px]"
            onClick={() => setActiveOrg("total")}
          >
            <span className="text-muted-foreground text-xs">Total</span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {totalDeployments.toLocaleString()}
            </span>
          </button>
          {breakdownSeries.slice(0, 3).map((series: any, index: number) => {
            const isActive = activeOrg === series.breakdown;
            return (
              <button
                key={series.breakdown}
                data-active={isActive}
                className="data-[active=true]:bg-muted/50 flex flex-1 flex-col justify-center gap-1 border-t px-4 py-4 text-left border-l sm:border-t-0 sm:px-6 sm:py-6 whitespace-nowrap min-w-[100px]"
                onClick={() => setActiveOrg(series.breakdown)}
              >
                <span className="text-muted-foreground text-xs">
                  {series.breakdown === "other"
                    ? "Other"
                    : `Org ${series.breakdown.slice(0, 8)}`}
                </span>
                <span className="text-lg leading-none font-bold sm:text-3xl">
                  {series.total.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[200px] w-full"
        >
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  year: "2-digit",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                />
              }
            />
            <Line
              dataKey="deployments"
              type="monotone"
              stroke={
                activeOrg ? chartConfig[activeOrg]?.color : "var(--chart-1)"
              }
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
