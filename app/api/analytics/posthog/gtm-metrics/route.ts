/**
 * GTM (Go-to-Market) metrics API route
 * Handles HubSpot data from PostHog data warehouse
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getLeadGenerationMetrics,
  getSalesPipelineMetrics,
  getCustomerLifecycleMetrics,
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
    const metricType = searchParams.get("type"); // lead-generation, sales-pipeline, customer-lifecycle
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
      case "lead-generation":
        data = await getLeadGenerationMetrics(startDate, endDate);
        break;

      case "sales-pipeline":
        data = await getSalesPipelineMetrics(startDate, endDate);
        break;

      case "customer-lifecycle":
        data = await getCustomerLifecycleMetrics(startDate, endDate);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown metric type: ${metricType}` },
          { status: 400 }
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching GTM metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch GTM metrics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

