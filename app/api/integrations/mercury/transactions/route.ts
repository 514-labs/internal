/**
 * Mercury Transactions API Endpoint
 * GET: List all transactions across all accounts
 *
 * Query parameters:
 * - limit: Max results (1-1000, default 1000)
 * - offset: Number of results to skip
 * - start: Earliest createdAt date (YYYY-MM-DD)
 * - end: Latest createdAt date (YYYY-MM-DD)
 * - postedStart: Earliest postedAt date (YYYY-MM-DD)
 * - postedEnd: Latest postedAt date (YYYY-MM-DD)
 * - status: Transaction status filter
 * - order: Sort order ('asc' or 'desc', default 'asc')
 * - search: Search term for transaction descriptions
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
    const postedStart = searchParams.get("postedStart");
    const postedEnd = searchParams.get("postedEnd");
    const status = searchParams.get("status");
    const order = searchParams.get("order");
    const search = searchParams.get("search");

    const client = await createMercuryClient(userId);
    const transactions = await client.listTransactions({
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      start: start || undefined,
      end: end || undefined,
      postedStart: postedStart || undefined,
      postedEnd: postedEnd || undefined,
      status: status || undefined,
      order: order === "asc" || order === "desc" ? order : undefined,
      search: search || undefined,
    });

    return NextResponse.json({ data: transactions });
  } catch (error) {
    return handleMercuryError(error, "fetch transactions");
  }
}
