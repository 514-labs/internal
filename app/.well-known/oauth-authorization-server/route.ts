// OAuth 2.0 Authorization Server Metadata endpoint (RFC 8414)
// This is an alias to the OpenID Configuration endpoint for compatibility
// with both OAuth 2.0 and OpenID Connect discovery

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const clerkDomain = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.match(
    /pk_(test|live)_([^.]+)/
  )?.[2];

  if (!clerkDomain) {
    return NextResponse.json(
      { error: "Clerk domain not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch Clerk's OpenID configuration (which includes OAuth 2.0 metadata)
    const clerkConfigUrl = `https://${clerkDomain}.clerk.accounts.dev/.well-known/openid-configuration`;
    const response = await fetch(clerkConfigUrl);
    const clerkConfig = await response.json();

    // Return the full configuration with all required OAuth 2.0 fields
    return NextResponse.json({
      ...clerkConfig,
      // Required fields per RFC 8414 and MCP spec
      issuer: clerkConfig.issuer || `https://${clerkDomain}.clerk.accounts.dev`,
      authorization_endpoint: clerkConfig.authorization_endpoint,
      token_endpoint: clerkConfig.token_endpoint,
      jwks_uri: clerkConfig.jwks_uri,
      registration_endpoint: clerkConfig.registration_endpoint,
      // Additional OAuth 2.0 metadata
      response_types_supported: clerkConfig.response_types_supported || ["code"],
      grant_types_supported: clerkConfig.grant_types_supported || [
        "authorization_code",
        "refresh_token",
      ],
      code_challenge_methods_supported:
        clerkConfig.code_challenge_methods_supported || ["S256"],
      scopes_supported: clerkConfig.scopes_supported || [
        "openid",
        "profile",
        "email",
      ],
    });
  } catch (error) {
    console.error("Error fetching Clerk OAuth config:", error);
    return NextResponse.json(
      { error: "Failed to fetch OAuth authorization server configuration" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
