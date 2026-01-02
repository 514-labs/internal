/**
 * Google Calendar Integration Status Endpoint
 * Returns connection status and token information for admin users
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { getGoogleCalendarTokens } from "@/lib/integrations/google-calendar";

export async function GET() {
  let userId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error(
      "Google Calendar status auth error:",
      (error as Error).message
    );
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 401 }
    );
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireAdmin(userId);

    // Get token information
    const tokens = await getGoogleCalendarTokens();

    if (!tokens) {
      return NextResponse.json({
        connected: false,
        message: "Google Calendar is not connected",
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
    console.error("Google Calendar status check error:", error);
    return NextResponse.json(
      {
        error: "Status check failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}


