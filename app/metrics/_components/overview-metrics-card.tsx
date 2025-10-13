"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "./metric-card";
import { Activity, Users, Zap } from "lucide-react";

interface OverviewMetricsCardProps {
  startDate: string;
  endDate: string;
}

export function OverviewMetricsCard({
  startDate,
  endDate,
}: OverviewMetricsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["overview-metrics", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      const response = await fetch(`/api/analytics/posthog/metrics?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch overview metrics");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription className="text-red-500">
            Error loading overview metrics
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metrics = data || {};
  const {
    totalUsers = 0,
    totalActiveUsers = 0,
    totalEvents = 0,
    productsMetrics = {
      boreal: { dau: 0, mau: 0 },
      moosestack: { dau: 0, mau: 0 },
    },
  } = metrics;

  const totalDAU = Math.round(
    productsMetrics.boreal.dau + productsMetrics.moosestack.dau
  );
  const totalMAU = Math.round(
    productsMetrics.boreal.mau + productsMetrics.moosestack.mau
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Users"
        value={totalUsers}
        description="Unique users in period"
        trend={totalUsers > 0 ? "up" : "neutral"}
      />
      <MetricCard
        title="Daily Active Users"
        value={totalDAU}
        description="Average across products"
        trend={totalDAU > 0 ? "up" : "neutral"}
        comparisonValues={[
          { label: "Boreal", value: Math.round(productsMetrics.boreal.dau) },
          {
            label: "Moosestack",
            value: Math.round(productsMetrics.moosestack.dau),
          },
        ]}
      />
      <MetricCard
        title="Monthly Active Users"
        value={totalMAU}
        description="Unique users per 30 days"
        trend={totalMAU > 0 ? "up" : "neutral"}
        comparisonValues={[
          { label: "Boreal", value: Math.round(productsMetrics.boreal.mau) },
          {
            label: "Moosestack",
            value: Math.round(productsMetrics.moosestack.mau),
          },
        ]}
      />
      <MetricCard
        title="Total Events"
        value={totalEvents}
        description="Events tracked in period"
        trend={totalEvents > 0 ? "up" : "neutral"}
      />
    </div>
  );
}
