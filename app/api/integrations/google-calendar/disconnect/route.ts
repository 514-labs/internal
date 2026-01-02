/**
 * Google Calendar OAuth Disconnect/Revoke Handler
 * Revokes Google Calendar OAuth token and removes from database
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { revokeGoogleCalendarToken } from "@/lib/integrations/google-calendar";

export async function POST() {
  try {
    // Verify user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(userId);

    // Revoke token and delete from database
    await revokeGoogleCalendarToken();

    return NextResponse.json({
      success: true,
      message: "Google Calendar integration disconnected successfully",
    });
  } catch (error) {
    console.error("Google Calendar disconnect error:", error);

    return NextResponse.json(
      {
        error: "Disconnect failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}


