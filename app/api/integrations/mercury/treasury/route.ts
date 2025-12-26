/**
 * Mercury Treasury API Endpoint
 * GET: List all treasury accounts
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMercuryClient } from "@/lib/integrations/mercury";
import { handleMercuryError } from "@/lib/integrations/mercury-error-handler";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await createMercuryClient(userId);
    const treasury = await client.getTreasury();

    return NextResponse.json({ data: treasury });
  } catch (error) {
    return handleMercuryError(error, "fetch treasury accounts");
  }
}

