"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { addDays, subDays } from "date-fns";
import { DateRangeSelector } from "./date-range-selector";
import { OverviewMetricsCard } from "./overview-metrics-card";
import { BorealMetricsCard } from "./boreal-metrics-card";
import { MoosestackMetricsCard } from "./moosestack-metrics-card";
import { BorealJourneysCard } from "./boreal-journeys-card";
import { MoosestackJourneysCard } from "./moosestack-journeys-card";
import { GTMMetricsCard } from "./gtm-metrics-card";
import { GitHubStarsCard } from "./github-stars-card";

export function MetricsClient() {
  // Default to last 30 days
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const startDate = dateRange?.from?.toISOString() || "";
  const endDate = dateRange?.to?.toISOString() || "";

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
          <p className="text-muted-foreground">
            Track key metrics across Boreal and Moosestack products
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Overview metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <OverviewMetricsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* Product metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Product Metrics</h2>
        <div className="grid gap-6">
          <BorealMetricsCard startDate={startDate} endDate={endDate} />
          <MoosestackMetricsCard startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* Go-to-Market metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Go-to-Market</h2>
        <GTMMetricsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* Community metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Community</h2>
        <GitHubStarsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* Journey metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">User Journeys</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <BorealJourneysCard startDate={startDate} endDate={endDate} />
          <MoosestackJourneysCard startDate={startDate} endDate={endDate} />
        </div>
      </div>
    </div>
  );
}
