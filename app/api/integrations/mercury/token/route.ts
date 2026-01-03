/**
 * Mercury Token Management API Endpoint
 * POST: Store/update user's Mercury API token
 * DELETE: Remove user's Mercury API token
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  storeMercuryToken,
  deleteMercuryToken,
  validateMercuryToken,
} from "@/lib/integrations/mercury";
import { handleMercuryError } from "@/lib/integrations/mercury-error-handler";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string" || token.trim() === "") {
      return NextResponse.json(
        { error: "Invalid token", message: "API token is required" },
        { status: 400 }
      );
    }

    // Validate the token before storing
    const isValid = await validateMercuryToken(token.trim());
    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid token",
          message:
            "The provided API token is invalid. Please check the token and try again.",
        },
        { status: 400 }
      );
    }

    // Store the validated token
    await storeMercuryToken(userId, token.trim());

    return NextResponse.json({
      success: true,
      message: "Mercury API token saved successfully",
    });
  } catch (error) {
    return handleMercuryError(error, "save token");
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await deleteMercuryToken(userId);

    return NextResponse.json({
      success: true,
      message: "Mercury API token removed successfully",
    });
  } catch (error) {
    return handleMercuryError(error, "delete token");
  }
}


