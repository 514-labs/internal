/**
 * Rippling Job Board - Locations Endpoint
 * GET: Get locations for a job board
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

    const client = await createRipplingClient(userId);
    const locations = await client.getJobBoardLocations(boardSlug);

    return NextResponse.json({ data: locations });
  } catch (error) {
    return handleRipplingError(error, "fetch job board locations");
  }
}

