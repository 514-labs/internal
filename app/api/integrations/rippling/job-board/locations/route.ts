/**
 * Rippling Job Board - Locations Endpoint
 * GET: Get locations for the configured job board (no auth required)
 */

import { NextResponse } from "next/server";
import {
  getPublicJobBoardLocations,
  isJobBoardConfigured,
} from "@/lib/integrations/rippling";
import { handleRipplingError } from "@/lib/integrations/rippling-error-handler";

export async function GET() {
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

    const locations = await getPublicJobBoardLocations();

    return NextResponse.json({ data: locations });
  } catch (error) {
    return handleRipplingError(error, "fetch job board locations");
  }
}

