/**
 * API route for product-specific metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getProductMetrics } from "@/lib/analytics/posthog/queries";
import { TimeWindowSchema } from "@/lib/analytics/posthog/schemas";
import {
  ExternalAPIError,
  ValidationError,
} from "@/lib/analytics/shared/errors";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const product = searchParams.get("product");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate required parameters
    if (!product || !startDate || !endDate) {
      return NextResponse.json(
        { error: "product, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    // Validate product
    if (product !== "boreal" && product !== "moosestack") {
      return NextResponse.json(
        { error: "product must be either 'boreal' or 'moosestack'" },
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

    // Fetch product metrics
    const metrics = await getProductMetrics(
      product as "boreal" | "moosestack",
      {
        startDate,
        endDate,
      }
    );

    return NextResponse.json({
      product,
      timeWindow: { startDate, endDate },
      ...metrics,
    });
  } catch (error) {
    console.error("Error fetching product metrics:", error);

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ExternalAPIError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    return NextResponse.json(
      { error: "Failed to fetch product metrics" },
      { status: 500 }
    );
  }
}
