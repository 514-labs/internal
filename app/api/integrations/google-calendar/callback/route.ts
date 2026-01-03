/**
 * Google Calendar OAuth Callback Handler
 * Exchanges authorization code for access token and stores in database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { storeGoogleCalendarTokens } from "@/lib/integrations/google-calendar";
import { cookies } from "next/headers";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated and is an admin
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL("/sign-in?error=unauthorized", request.url)
      );
    }

    await requireAdmin(userId);

    // Get authorization code and state from query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle OAuth errors
    if (error) {
      const errorDescription = searchParams.get("error_description");
      return NextResponse.redirect(
        new URL(
          `/admin/integrations?error=${encodeURIComponent(
            error
          )}&error_description=${encodeURIComponent(errorDescription || "")}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/admin/integrations?error=missing_code", request.url)
      );
    }

    // Verify state for CSRF protection
    const cookieStore = await cookies();
    const storedState = cookieStore.get("google_calendar_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/admin/integrations?error=invalid_state", request.url)
      );
    }

    // Get required environment variables
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        "GOOGLE_CALENDAR_CLIENT_ID, GOOGLE_CALENDAR_CLIENT_SECRET, and GOOGLE_CALENDAR_REDIRECT_URI must be set"
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Google Calendar token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL(
          `/admin/integrations?error=token_exchange_failed&details=${encodeURIComponent(
            errorText
          )}`,
          request.url
        )
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Store tokens in database
    await storeGoogleCalendarTokens(tokens);

    // Clean up cookies
    cookieStore.delete("google_calendar_oauth_state");

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL(
        "/admin/integrations?success=google_calendar_connected",
        request.url
      )
    );
  } catch (error) {
    console.error("Google Calendar OAuth callback error:", error);

    return NextResponse.redirect(
      new URL(
        `/admin/integrations?error=callback_failed&details=${encodeURIComponent(
          (error as Error).message
        )}`,
        request.url
      )
    );
  }
}


