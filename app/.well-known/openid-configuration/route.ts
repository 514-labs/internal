import { baseURL } from "@/baseUrl";
import { NextResponse } from "next/server";

// OpenID Connect Discovery
// Alternative discovery endpoint (OpenID Connect standard)
export async function GET() {
  // Extract Clerk domain from publishable key
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not configured" },
      { status: 500 }
    );
  }

  // Parse Clerk domain from key format: pk_test_XXXXX or pk_live_XXXXX
  const clerkDomain = publishableKey.includes("_test_")
    ? "clerk.accounts.dev"
    : "clerk.com";

  try {
    // Fetch Clerk's OpenID configuration
    const clerkConfigUrl = `https://${clerkDomain}/.well-known/openid-configuration`;
    const response = await fetch(clerkConfigUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch Clerk OIDC config: ${response.status}`);
    }

    const clerkConfig = await response.json();

    // Return Clerk's configuration with our issuer
    return NextResponse.json({
      ...clerkConfig,
      issuer: baseURL,
      // Ensure OAuth 2.1 compliance
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
    });
  } catch (error) {
    console.error("Error fetching Clerk OIDC config:", error);
    return NextResponse.json(
      { error: "Failed to fetch OpenID configuration" },
      { status: 500 }
    );
  }
}

// Allow CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
