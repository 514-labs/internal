/**
 * Linear Projects API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-keys";
import { getProjects } from "@/lib/analytics/linear/queries";
import { LinearQueryOptionsSchema } from "@/lib/analytics/linear/schemas";
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
    const options = LinearQueryOptionsSchema.parse({
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
      search: searchParams.get("search") || undefined,
      includeArchived: searchParams.get("includeArchived") === "true",
    });

    // Fetch projects
    const projects = await getProjects(options);

    return NextResponse.json(
      createSuccessResponse(projects, {
        total: projects.length,
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
