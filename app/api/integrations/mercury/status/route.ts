/**
 * Mercury Status API Endpoint
 * GET: Check if user has a Mercury connection
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMercuryConnectionStatus } from "@/lib/integrations/mercury";

export async function GET() {
  let userId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;
  } catch (error) {
    console.error("Mercury status auth error:", (error as Error).message);
    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const status = await getMercuryConnectionStatus(userId);
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error checking Mercury status:", error);
    return NextResponse.json(
      { connected: false, message: "Error checking connection status" },
      { status: 500 }
    );
  }
}

