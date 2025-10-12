/**
 * Rippling Employees API endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-keys";
import { getEmployees, getEmployee } from "@/lib/analytics/rippling/queries";
import { RipplingQueryOptionsSchema } from "@/lib/analytics/rippling/schemas";
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
    const employeeId = searchParams.get("id");

    // If specific employee ID is provided, fetch single employee
    if (employeeId) {
      const employee = await getEmployee(employeeId);
      return NextResponse.json(createSuccessResponse(employee));
    }

    // Otherwise, fetch list of employees
    const options = RipplingQueryOptionsSchema.parse({
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : undefined,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : undefined,
      status: searchParams.get("status") as
        | "ACTIVE"
        | "INACTIVE"
        | "TERMINATED"
        | "ON_LEAVE"
        | "PENDING"
        | undefined,
      departmentId: searchParams.get("departmentId") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      search: searchParams.get("search") || undefined,
    });

    const employees = await getEmployees(options);

    return NextResponse.json(
      createSuccessResponse(employees, {
        total: employees.length,
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
