/**
 * Web analytics metrics API route
 * Handles traffic, sources, and conversion metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getWebTrafficMetrics,
  getTrafficSourceMetrics,
  getConversionFunnelMetrics,
} from "@/lib/analytics/posthog/queries";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const metricType = searchParams.get("type"); // traffic, sources, funnel
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required params
    if (!metricType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required parameters: type, startDate, endDate" },
        { status: 400 }
      );
    }

    // Fetch appropriate metrics based on type
    let data;

    switch (metricType) {
      case "traffic":
        data = await getWebTrafficMetrics(startDate, endDate);
        break;

      case "sources":
        data = await getTrafficSourceMetrics(startDate, endDate);
        break;

      case "funnel": {
        // For funnel, we need funnel name and events
        const funnelName = searchParams.get("funnelName") || "Default Funnel";
        const eventsParam = searchParams.get("events");

        if (!eventsParam) {
          return NextResponse.json(
            { error: "Missing required parameter: events" },
            { status: 400 }
          );
        }

        const events = eventsParam.split(",");
        data = await getConversionFunnelMetrics(
          funnelName,
          events,
          startDate,
          endDate
        );
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown metric type: ${metricType}` },
          { status: 400 }
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching web metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch web metrics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
