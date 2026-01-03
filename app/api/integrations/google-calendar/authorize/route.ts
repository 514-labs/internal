/**
 * Google Calendar OAuth Authorization Initiation
 * Redirects admin users to Google OAuth authorization page
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { cookies } from "next/headers";
import * as crypto from "crypto";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";

export async function GET() {
  try {
    // Verify user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await requireAdmin(userId);

    // Check required environment variables
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: "Configuration error",
          message:
            "GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_REDIRECT_URI must be set",
        },
        { status: 500 }
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString("base64url");

    // Store state in a secure cookie
    const cookieStore = await cookies();
    cookieStore.set("google_calendar_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Build Google OAuth authorization URL
    const authUrl = new URL(GOOGLE_AUTHORIZE_URL);
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "scope",
      "https://www.googleapis.com/auth/calendar.readonly"
    );
    authUrl.searchParams.set("access_type", "offline"); // Request refresh token
    authUrl.searchParams.set("prompt", "consent"); // Force consent to get refresh token
    authUrl.searchParams.set("state", state);

    // Redirect to Google OAuth page
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error("Google Calendar OAuth authorization error:", error);

    return NextResponse.json(
      {
        error: "Authorization failed",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}


