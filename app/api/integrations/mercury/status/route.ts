/**
 * Mercury Status API Endpoint
 * GET: Check if user has a Mercury connection
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMercuryConnectionStatus } from "@/lib/integrations/mercury";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

