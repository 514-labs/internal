/**
 * Rippling Company API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-keys";
import { getCompany } from "@/lib/analytics/rippling/queries";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/analytics/shared/types";
import { AnalyticsError } from "@/lib/analytics/shared/errors";

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    await withApiKeyAuth(request);

    // Fetch company details
    const company = await getCompany();

    return NextResponse.json(createSuccessResponse(company));
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
