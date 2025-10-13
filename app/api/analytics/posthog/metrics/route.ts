/**
 * API route for overview metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getOverviewMetrics } from "@/lib/analytics/posthog/queries";
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

    // Fetch overview metrics
    const metrics = await getOverviewMetrics({
      startDate,
      endDate,
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching overview metrics:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ExternalAPIError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to fetch overview metrics" },
      { status: 500 }
    );
  }
}
