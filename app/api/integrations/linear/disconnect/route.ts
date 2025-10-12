/**
 * Linear OAuth Disconnect/Revoke Handler
 * Revokes Linear OAuth token and removes from database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { revokeLinearToken } from "@/lib/integrations/linear-oauth";
import { resetLinearClient } from "@/lib/analytics/linear/client";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(userId);

    // Revoke token and delete from database
    await revokeLinearToken();

    // Reset Linear client
    resetLinearClient();

    return NextResponse.json({
      success: true,
      message: "Linear integration disconnected successfully",
    });
  } catch (error) {
    console.error("Linear disconnect error:", error);

    return NextResponse.json(
      {
        error: "Disconnect failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
