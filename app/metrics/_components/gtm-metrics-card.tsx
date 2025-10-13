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

interface GTMMetricsCardProps {
  startDate: string;
  endDate: string;
}

export function GTMMetricsCard({ startDate, endDate }: GTMMetricsCardProps) {
  // Fetch lead generation metrics
  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ["lead-generation", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "lead-generation",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/gtm-metrics?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch lead metrics");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch sales pipeline metrics
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["sales-pipeline", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: "sales-pipeline",
        startDate,
        endDate,
      });
      const response = await fetch(
        `/api/analytics/posthog/gtm-metrics?${params}`
      );
      if (!response.ok) throw new Error("Failed to fetch sales metrics");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = leadLoading || salesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Go-to-Market Metrics</CardTitle>
          <CardDescription>Loading metrics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const leads = leadData || {
    totalContacts: 0,
    newContacts: 0,
    mqls: 0,
    sqls: 0,
    contactToLeadRate: 0,
  };
  const sales = salesData || {
    totalDeals: 0,
    pipelineValue: 0,
    averageDealSize: 0,
    winRate: 0,
    dealsByStage: [],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Go-to-Market Metrics</CardTitle>
        <CardDescription>HubSpot lead and sales pipeline data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lead Generation */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Lead Generation</h4>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Contacts"
              value={leads.totalContacts || 0}
              description="All contacts"
              trend={leads.newContacts > 0 ? "up" : "neutral"}
            />
            <MetricCard
              title="New Contacts"
              value={leads.newContacts || 0}
              description="In period"
              trend="up"
            />
            <MetricCard
              title="MQLs"
              value={leads.mqls || 0}
              description="Marketing qualified"
              trend={leads.mqls > 0 ? "up" : "neutral"}
            />
            <MetricCard
              title="SQLs"
              value={leads.sqls || 0}
              description="Sales qualified"
              trend={leads.sqls > 0 ? "up" : "neutral"}
            />
          </div>
        </div>

        {/* Sales Pipeline */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Sales Pipeline</h4>
          <div className="grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Total Deals"
              value={sales.totalDeals || 0}
              description="Open deals"
              trend={sales.totalDeals > 0 ? "up" : "neutral"}
            />
            <MetricCard
              title="Pipeline Value"
              value={`$${((sales.pipelineValue || 0) / 1000).toFixed(0)}K`}
              description="Total value"
              trend="neutral"
            />
            <MetricCard
              title="Avg Deal Size"
              value={`$${((sales.averageDealSize || 0) / 1000).toFixed(1)}K`}
              description="Per deal"
              trend="neutral"
            />
            <MetricCard
              title="Win Rate"
              value={(sales.winRate || 0).toFixed(1)}
              unit="%"
              description="Closed won rate"
              trend={sales.winRate > 20 ? "up" : "neutral"}
            />
          </div>
        </div>

        {/* Deal stages */}
        {sales.dealsByStage && sales.dealsByStage.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Deals by Stage</h4>
            <div className="grid gap-4 md:grid-cols-4">
              {sales.dealsByStage.map((stage: any) => (
                <MetricCard
                  key={stage.stage}
                  title={stage.stage}
                  value={stage.count}
                  description={`$${(stage.value / 1000).toFixed(0)}K`}
                  trend="neutral"
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

