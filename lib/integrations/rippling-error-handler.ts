/**
 * Shared error handler for Rippling API routes
 * Extracts proper status codes and messages from errors
 */

import { NextResponse } from "next/server";
import { AnalyticsError } from "../analytics/shared/errors";

interface RipplingErrorResponse {
  error: string;
  message: string;
  details?: unknown;
  endpoint?: string;
}

/**
 * Handle Rippling API errors and return appropriate NextResponse
 */
export function handleRipplingError(
  error: unknown,
  operation: string
): NextResponse<RipplingErrorResponse> {
  const err = error as Error;
  
  // Log the error (but never the token)
  console.error(`Rippling ${operation} error:`, err.message);

  // Check if it's an AnalyticsError with status code
  if (err instanceof AnalyticsError || "statusCode" in err) {
    const analyticsErr = err as AnalyticsError;
    return NextResponse.json(
      {
        error: analyticsErr.code || operation,
        message: analyticsErr.message,
        details: analyticsErr.details,
      },
      { status: analyticsErr.statusCode || 500 }
    );
  }

  // Check for specific error patterns
  if (err.message.includes("not connected")) {
    return NextResponse.json(
      {
        error: "Not connected",
        message:
          "Rippling is not connected. Please add your API token in Settings > Integrations.",
      },
      { status: 400 }
    );
  }

  if (err.message.includes("authentication failed")) {
    return NextResponse.json(
      {
        error: "Authentication failed",
        message: err.message,
      },
      { status: 401 }
    );
  }

  if (err.message.includes("Access forbidden")) {
    return NextResponse.json(
      {
        error: "Access forbidden",
        message: err.message,
      },
      { status: 403 }
    );
  }

  // Default 500 error
  return NextResponse.json(
    {
      error: `Failed to ${operation}`,
      message: err.message,
    },
    { status: 500 }
  );
}

