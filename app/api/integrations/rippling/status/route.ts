/**
 * Rippling Integration Status Endpoint
 * Returns connection status for the authenticated user
 *
 * SECURITY: Each user can only see their own connection status.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRipplingConnectionStatus } from "@/lib/integrations/rippling";

/**
 * GET /api/integrations/rippling/status
 * Get Rippling connection status for the authenticated user
 */
export async function GET() {
  let userId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error("Rippling status auth error:", (error as Error).message);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

