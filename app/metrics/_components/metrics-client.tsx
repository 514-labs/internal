"use client";

import * as React from "react";
import { DateRange } from "react-day-picker";
import { format, subDays } from "date-fns";
import { DateRangeSelector } from "./date-range-selector";
import { OverviewMetricsCard } from "./overview-metrics-card";
import { OSSInstallsCard } from "./oss-installs-card";
import { ProjectsCard } from "./projects-card";
import { DeploymentsCard } from "./deployments-card";
import { BorealMetricsCard } from "./boreal-metrics-card";
import { MoosestackMetricsCard } from "./moosestack-metrics-card";
import { BorealJourneysCard } from "./boreal-journeys-card";
import { MoosestackJourneysCard } from "./moosestack-journeys-card";
import { useUrlDateState } from "@/hooks/use-url-state";
import { useBreadcrumb } from "@/components/breadcrumb-provider";

export function MetricsClient() {
  // Default to last 30 days
  const [fromDate, setFromDate] = useUrlDateState(
    "from",
    subDays(new Date(), 30)
  );
  const [toDate, setToDate] = useUrlDateState("to", new Date());
  const { setItems } = useBreadcrumb();

  // Create DateRange object for the selector
  const dateRange: DateRange | undefined = React.useMemo(
    () => ({
      from: fromDate || undefined,
      to: toDate || undefined,
    }),
    [fromDate, toDate]
  );

  // Update breadcrumb with date range
  React.useEffect(() => {
    if (fromDate && toDate) {
      setItems([
        {
          label: `${format(fromDate, "MMM d")} - ${format(
            toDate,
            "MMM d, yyyy"
          )}`,
        },
      ]);
    } else {
      setItems([]);
    }
  }, [fromDate, toDate, setItems]);

  const handleDateRangeChange = React.useCallback(
    (range: DateRange | undefined) => {
      setFromDate(range?.from || null);
      setToDate(range?.to || null);
    },
    [setFromDate, setToDate]
  );

  const startDate = fromDate?.toISOString() || "";
  const endDate = toDate?.toISOString() || "";

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
        <DateRangeSelector value={dateRange} onChange={handleDateRangeChange} />
      </div>

      {/* Overview metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Overview</h2>
        <OverviewMetricsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* OSS Install metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Open Source Adoption</h2>
        <OSSInstallsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* Projects metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Project Growth</h2>
        <ProjectsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* Deployments metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Deployment Activity</h2>
        <DeploymentsCard startDate={startDate} endDate={endDate} />
      </div>

      {/* Product metrics */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Product Metrics</h2>
        <div className="grid gap-6">
          <BorealMetricsCard startDate={startDate} endDate={endDate} />
          <MoosestackMetricsCard startDate={startDate} endDate={endDate} />
        </div>
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
