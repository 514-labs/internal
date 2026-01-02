import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/linear/initiatives
 * 
 * Fetches initiative details from Linear by ID.
 * Returns mock data for now - will be replaced with actual Linear API integration.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ initiatives: [] });
    }

    // For now, return empty initiatives since we don't have real Linear data
    // In production, this would fetch from the Linear API using the connector
    // const initiatives = await fetchInitiativesFromLinear(ids);

    // Return empty array - initiatives exist but can't be fetched
    // This triggers the "referenced but not found" message
    return NextResponse.json({ initiatives: [] });
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    return NextResponse.json(
      { error: "Failed to fetch initiatives" },
      { status: 500 }
    );
  }
}


