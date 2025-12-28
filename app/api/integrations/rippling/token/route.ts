/**
 * Rippling Token Management Endpoint
 * POST: Store/update user's Rippling API token
 * DELETE: Remove user's Rippling API token
 *
 * SECURITY: Each user can only manage their own token.
 * The userId comes from Clerk authentication, not user input.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  storeRipplingToken,
  deleteRipplingToken,
  validateRipplingToken,
} from "@/lib/integrations/rippling";

/**
 * POST /api/integrations/rippling/token
 * Store a new Rippling API token for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user - userId comes from Clerk, not user input
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.trim() === "") {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Validate token with Rippling API before storing
    const isValid = await validateRipplingToken(token);

    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid token",
          message:
            "The provided Rippling API token is invalid or expired. Please check your token and try again.",
        },
        { status: 400 }
      );
    }

    // Store the token - scoped to authenticated user
    await storeRipplingToken(userId, token);

    return NextResponse.json({
      success: true,
      message: "Rippling API token saved successfully",
    });
  } catch (error) {
    // SECURITY: Never include the token in error logs or responses
    console.error("Rippling token storage error:", (error as Error).message);

    return NextResponse.json(
      {
        error: "Failed to save token",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/rippling/token
 * Remove the Rippling API token for the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the token - scoped to authenticated user
    await deleteRipplingToken(userId);

    return NextResponse.json({
      success: true,
      message: "Rippling integration disconnected successfully",
    });
  } catch (error) {
    console.error("Rippling token deletion error:", (error as Error).message);

    return NextResponse.json(
      {
        error: "Failed to disconnect",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

