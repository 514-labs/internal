/**
 * HubSpot Data (via PostHog Data Warehouse) API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-keys";
import {
  getHubspotContacts,
  getHubspotDeals,
  getHubspotCompanies,
  queryHubspotData,
} from "@/lib/analytics/posthog/queries";
import { QueryOptionsSchema } from "@/lib/analytics/shared/types";
import {
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/analytics/shared/types";
import { AnalyticsError, ValidationError } from "@/lib/analytics/shared/errors";

export async function GET(request: NextRequest) {
  try {
    // Authenticate request
    await withApiKeyAuth(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const table = searchParams.get("table"); // contacts, deals, companies, or custom table name

    if (!table) {
      throw new ValidationError("table query parameter is required");
    }

    const options = QueryOptionsSchema.parse({
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || undefined,
      sortOrder: searchParams.get("sortOrder") as "asc" | "desc" | undefined,
    });

    // Fetch data based on table type
    let data;
    switch (table.toLowerCase()) {
      case "contacts":
        data = await getHubspotContacts(options);
        break;
      case "deals":
        data = await getHubspotDeals(options);
        break;
      case "companies":
        data = await getHubspotCompanies(options);
        break;
      default:
        // Allow querying custom tables
        data = await queryHubspotData(table, options);
    }

    return NextResponse.json(
      createSuccessResponse(data, {
        total: data.length,
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
