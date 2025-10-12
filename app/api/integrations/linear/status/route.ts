/**
 * Linear Integration Status Endpoint
 * Returns connection status and token information for admin users
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { getLinearTokens } from "@/lib/integrations/linear-oauth";

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(userId);

    // Get token information
    const tokens = await getLinearTokens();

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        message: "Linear is not connected",
      });
    }

    // Return status with expiration info
    return NextResponse.json({
      connected: true,
      expiresAt: tokens.expires_at,
      scope: tokens.scope,
      hasRefreshToken: !!tokens.refresh_token,
    });
  } catch (error) {
    console.error("Linear status check error:", error);

    return NextResponse.json(
      {
        error: "Status check failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
