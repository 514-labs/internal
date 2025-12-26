/**
 * Rippling Job Board - Jobs Endpoint
 * GET: List jobs for a job board
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRipplingClient } from "@/lib/integrations/rippling";
import { handleRipplingError } from "@/lib/integrations/rippling-error-handler";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardSlug: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { boardSlug } = await params;
    if (!boardSlug) {
      return NextResponse.json(
        { error: "Board slug is required" },
        { status: 400 }
      );
    }

    // Get optional query params
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get("searchTerm") || undefined;
    const workLocation = searchParams.get("workLocation") || undefined;
    const department = searchParams.get("department") || undefined;

    const client = await createRipplingClient(userId);
    const jobs = await client.getJobBoardJobs(boardSlug, {
      searchTerm,
      workLocation,
      department,
    });

    return NextResponse.json({ data: jobs });
  } catch (error) {
    return handleRipplingError(error, "fetch job board jobs");
  }
}

