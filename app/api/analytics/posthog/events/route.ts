/**
 * PostHog Events API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-keys";
import { getEvents } from "@/lib/analytics/posthog/queries";
import { EventQueryOptionsSchema } from "@/lib/analytics/posthog/schemas";
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
    const options = EventQueryOptionsSchema.parse({
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      eventName: searchParams.get("eventName") || undefined,
      distinctId: searchParams.get("distinctId") || undefined,
    });

    // Fetch events
    const events = await getEvents(options);

    return NextResponse.json(
      createSuccessResponse(events, {
        total: events.length,
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
