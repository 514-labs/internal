/**
 * Rippling Integration Status Endpoint
 * Returns connection status for the authenticated user
 *
 * SECURITY: Each user can only see their own connection status.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRipplingConnectionStatus } from "@/lib/integrations/rippling";

/**
 * GET /api/integrations/rippling/status
 * Get Rippling connection status for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get connection status - scoped to authenticated user
    const status = await getRipplingConnectionStatus(userId);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Rippling status check error:", (error as Error).message);

    return NextResponse.json(
      {
        error: "Status check failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

