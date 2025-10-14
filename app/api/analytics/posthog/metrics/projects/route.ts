/**
 * API route for cumulative projects metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getCumulativeProjects } from "@/lib/analytics/posthog/queries";
import { TimeWindowSchema } from "@/lib/analytics/posthog/schemas";
import {
  ExternalAPIError,
  ValidationError,
} from "@/lib/analytics/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const breakdownProperty =
      searchParams.get("breakdownProperty") || undefined;
    const intervalUnit = searchParams.get("intervalUnit") as
      | "day"
      | "week"
      | "month"
      | undefined;
    const topN = searchParams.get("topN")
      ? parseInt(searchParams.get("topN")!)
      : undefined;

    // Validate required parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate are required" },
        { status: 400 }
      );
    }

    // Validate time window format
    try {
      TimeWindowSchema.parse({
        startDate,
        endDate,
        comparisonPeriods: [],
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid date format. Use ISO 8601 format." },
        { status: 400 }
      );
    }

    // Validate intervalUnit if provided
    if (intervalUnit && !["day", "week", "month"].includes(intervalUnit)) {
      return NextResponse.json(
        { error: "intervalUnit must be 'day', 'week', or 'month'" },
        { status: 400 }
      );
    }

    // Fetch cumulative projects metrics
    const metrics = await getCumulativeProjects(
      {
        startDate,
        endDate,
      },
      {
        breakdownProperty,
        intervalUnit,
        topN,
      }
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching cumulative projects metrics:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ExternalAPIError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to fetch cumulative projects metrics" },
      { status: 500 }
    );
  }
}
