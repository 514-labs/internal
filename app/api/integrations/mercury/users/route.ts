/**
 * Mercury Users API Endpoint
 * GET: List all users
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
    const users = await client.getUsers();

    return NextResponse.json({ data: users });
  } catch (error) {
    return handleMercuryError(error, "fetch users");
  }
}

