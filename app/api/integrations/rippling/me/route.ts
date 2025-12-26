/**
 * Rippling Me/Profile API Endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRipplingClient } from "@/lib/integrations/rippling";
import { handleRipplingError } from "@/lib/integrations/rippling-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await createRipplingClient(userId);
    const profile = await client.getMe();

    return NextResponse.json({ data: profile });
  } catch (error) {
    return handleRipplingError(error, "fetch profile");
  }
}
