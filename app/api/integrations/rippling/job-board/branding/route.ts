/**
 * Rippling Job Board - Branding Endpoint
 * GET: Get branding info for the configured job board (no auth required)
 */

import { NextResponse } from "next/server";
import {
  getPublicJobBoardBranding,
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

    const branding = await getPublicJobBoardBranding();

    return NextResponse.json({ data: branding });
  } catch (error) {
    return handleRipplingError(error, "fetch job board branding");
  }
}


