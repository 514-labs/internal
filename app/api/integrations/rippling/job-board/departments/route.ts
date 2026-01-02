/**
 * Rippling Job Board - Departments Endpoint
 * GET: Get departments for the configured job board (no auth required)
 */

import { NextResponse } from "next/server";
import {
  getPublicJobBoardDepartments,
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

    const departments = await getPublicJobBoardDepartments();

    return NextResponse.json({ data: departments });
  } catch (error) {
    return handleRipplingError(error, "fetch job board departments");
  }
}


