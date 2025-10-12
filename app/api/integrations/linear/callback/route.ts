/**
 * Linear OAuth Callback Handler
 * Exchanges authorization code for access token and stores in database
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireAdmin } from "@/lib/auth/api-keys";
import { storeLinearTokens } from "@/lib/integrations/linear-oauth";
import { resetLinearClient } from "@/lib/analytics/linear/client";
import { cookies } from "next/headers";

const LINEAR_TOKEN_ENDPOINT = "https://api.linear.app/oauth/token";

interface LinearTokenResponse {
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
          `/settings/integrations?error=${encodeURIComponent(
            error
          )}&error_description=${encodeURIComponent(errorDescription || "")}`,
          request.url
        )
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=missing_code", request.url)
      );
    }

    // Verify state for CSRF protection
    const cookieStore = await cookies();
    const storedState = cookieStore.get("linear_oauth_state")?.value;

    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=invalid_state", request.url)
      );
    }

    // Get code verifier from cookie
    const codeVerifier = cookieStore.get("linear_code_verifier")?.value;

    if (!codeVerifier) {
      return NextResponse.redirect(
        new URL("/settings/integrations?error=missing_verifier", request.url)
      );
    }

    // Get required environment variables
    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;
    const redirectUri = process.env.LINEAR_OAUTH_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        "LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET, and LINEAR_OAUTH_REDIRECT_URI must be set"
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(LINEAR_TOKEN_ENDPOINT, {
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
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Linear token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL(
          `/settings/integrations?error=token_exchange_failed&details=${encodeURIComponent(
            errorText
          )}`,
          request.url
        )
      );
    }

    const tokens: LinearTokenResponse = await tokenResponse.json();

    // Store tokens in database
    await storeLinearTokens(tokens);

    // Reset Linear client to pick up new tokens
    resetLinearClient();

    // Clean up cookies
    cookieStore.delete("linear_oauth_state");
    cookieStore.delete("linear_code_verifier");

    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL("/settings/integrations?success=linear_connected", request.url)
    );
  } catch (error) {
    console.error("Linear OAuth callback error:", error);

    return NextResponse.redirect(
      new URL(
        `/settings/integrations?error=callback_failed&details=${encodeURIComponent(
          (error as Error).message
        )}`,
        request.url
      )
    );
  }
}
