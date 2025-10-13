/**
 * Product metrics API route
 * Handles Moosestack, Boreal, and GitHub metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getMoosestackInstallMetrics,
  getMoosestackCommandMetrics,
  getBorealDeploymentMetrics,
  getBorealProjectMetrics,
  getGitHubStarMetrics,
} from "@/lib/analytics/posthog/queries";

export async function GET(request: NextRequest) {
  console.log("=== PRODUCT METRICS API HIT ===");
  console.log("Request URL:", request.url);

  try {
    // Check authentication
    const { userId } = await auth();
    console.log("User ID:", userId);

    if (!userId) {
      console.log("No user ID - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const metricType = searchParams.get("type"); // moosestack-installs, moosestack-commands, boreal-deployments, boreal-projects, github-stars
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log("[Product Metrics API] Request:", {
      metricType,
      startDate,
      endDate,
    });

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
      case "moosestack-installs":
        console.log("[Product Metrics API] Fetching Moosestack installs...");
        data = await getMoosestackInstallMetrics(startDate, endDate);
        console.log(
          "[Product Metrics API] Result:",
          JSON.stringify(data, null, 2)
        );
        break;

      case "moosestack-commands":
        console.log("[Product Metrics API] Fetching Moosestack commands...");
        data = await getMoosestackCommandMetrics(startDate, endDate);
        console.log(
          "[Product Metrics API] Result:",
          JSON.stringify(data, null, 2)
        );
        break;

      case "boreal-deployments":
        console.log("[Product Metrics API] Fetching Boreal deployments...");
        data = await getBorealDeploymentMetrics(startDate, endDate);
        console.log(
          "[Product Metrics API] Result:",
          JSON.stringify(data, null, 2)
        );
        break;

      case "boreal-projects":
        console.log("[Product Metrics API] Fetching Boreal projects...");
        data = await getBorealProjectMetrics(startDate, endDate);
        console.log(
          "[Product Metrics API] Result:",
          JSON.stringify(data, null, 2)
        );
        break;

      case "github-stars":
        console.log("[Product Metrics API] Fetching GitHub stars...");
        data = await getGitHubStarMetrics(startDate, endDate);
        console.log(
          "[Product Metrics API] Result:",
          JSON.stringify(data, null, 2)
        );
        break;

      default:
        return NextResponse.json(
          { error: `Unknown metric type: ${metricType}` },
          { status: 400 }
        );
    }

    console.log("[Product Metrics API] Returning data");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching product metrics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch product metrics",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
