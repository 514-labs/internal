/**
 * PostHog Page Views API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-keys";
import { getPageViews } from "@/lib/analytics/posthog/queries";
import { QueryOptionsSchema } from "@/lib/analytics/shared/types";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/analytics/shared/types";
import { AnalyticsError } from "@/lib/analytics/shared/errors";

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    await withApiKeyAuth(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const options = QueryOptionsSchema.parse({
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
    });

    // Fetch page views
    const pageViews = await getPageViews(options);

    return NextResponse.json(
      createSuccessResponse(pageViews, {
        total: pageViews.length,
        limit: options.limit,
        offset: options.offset,
      })
    );
  } catch (error) {
    if (error instanceof AnalyticsError) {
      return NextResponse.json(
        createErrorResponse(error.code, error.message, error.details),
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      createErrorResponse("INTERNAL_ERROR", "An unexpected error occurred"),
      { status: 500 }
    );
  }
}
