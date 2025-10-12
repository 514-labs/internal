/**
 * Linear OAuth Authorization Initiation
 * Redirects admin users to Linear OAuth authorization page
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { cookies } from "next/headers";
import * as crypto from "crypto";

const LINEAR_AUTHORIZE_URL = "https://linear.app/oauth/authorize";

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { verifier: string; challenge: string } {
  // Generate random code verifier
  const verifier = crypto.randomBytes(32).toString("base64url");

  // Generate code challenge (SHA256 hash of verifier)
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");

  return { verifier, challenge };
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(userId);

    // Check required environment variables
    const clientId = process.env.LINEAR_CLIENT_ID;
    const redirectUri = process.env.LINEAR_OAUTH_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: "Configuration error",
          message: "LINEAR_CLIENT_ID and LINEAR_OAUTH_REDIRECT_URI must be set",
        },
        { status: 500 }
      );
    }

    // Generate PKCE parameters
    const { verifier, challenge } = generatePKCE();

    // Store code verifier in a secure cookie (needed for token exchange)
    const cookieStore = await cookies();
    cookieStore.set("linear_code_verifier", verifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Build Linear OAuth authorization URL
    const authUrl = new URL(LINEAR_AUTHORIZE_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "read,write");
    authUrl.searchParams.set("actor", "app"); // Critical: app-level authentication
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    // Generate and store state for CSRF protection
    const state = crypto.randomBytes(16).toString("base64url");
    cookieStore.set("linear_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });
    authUrl.searchParams.set("state", state);

    // Redirect to Linear OAuth page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Linear OAuth authorization error:", error);

    return NextResponse.json(
      {
        error: "Authorization failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
