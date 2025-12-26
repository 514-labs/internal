/**
 * Mercury Transactions API Endpoint
 * GET: List all transactions across all accounts
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createMercuryClient } from "@/lib/integrations/mercury";
import { handleMercuryError } from "@/lib/integrations/mercury-error-handler";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const status = searchParams.get("status");

    const client = await createMercuryClient(userId);
    const transactions = await client.listTransactions({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      start: start || undefined,
      end: end || undefined,
      status: status || undefined,
    });

    return NextResponse.json({ data: transactions });
  } catch (error) {
    return handleMercuryError(error, "fetch transactions");
  }
}
