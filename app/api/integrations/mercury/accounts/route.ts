/**
 * Mercury Accounts API Endpoint
 * GET: List all accounts
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
    const accounts = await client.getAccounts();

    return NextResponse.json({ data: accounts });
  } catch (error) {
    return handleMercuryError(error, "fetch accounts");
  }
}


