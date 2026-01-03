/**
 * Rippling Job Board - Jobs Endpoint
 * GET: List jobs for the configured job board (no auth required)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getPublicJobBoardJobs,
  isJobBoardConfigured,
} from "@/lib/integrations/rippling";
import { handleRipplingError } from "@/lib/integrations/rippling-error-handler";

export async function GET(request: NextRequest) {
  try {
    if (!isJobBoardConfigured()) {
      return NextResponse.json(
        {
          error: "Job Board not configured",
          message: "Set RIPPLING_JOB_BOARD_SLUG environment variable.",
        },
        { status: 503 }
      );
    }

    // Get optional query params
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("searchTerm") || undefined;
    const workLocation = searchParams.get("workLocation") || undefined;
    const department = searchParams.get("department") || undefined;

    const jobs = await getPublicJobBoardJobs({
      searchTerm,
      workLocation,
      department,
    });

    return NextResponse.json({ data: jobs });
  } catch (error) {
    return handleRipplingError(error, "fetch job board jobs");
  }
}


