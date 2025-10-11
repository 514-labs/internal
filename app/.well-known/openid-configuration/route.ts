import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // This proxies to Clerk's OIDC discovery endpoint
  // Clerk provides authorization_endpoint, token_endpoint, jwks_uri, and registration_endpoint
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
    // Fetch Clerk's OpenID configuration
    const clerkConfigUrl = `https://${clerkDomain}.clerk.accounts.dev/.well-known/openid-configuration`;
    const response = await fetch(clerkConfigUrl);
    const clerkConfig = await response.json();

    // Return the Clerk configuration, optionally augmented with your own issuer
    return NextResponse.json({
      ...clerkConfig,
      // Ensure these required fields are present
      authorization_endpoint: clerkConfig.authorization_endpoint,
      token_endpoint: clerkConfig.token_endpoint,
      jwks_uri: clerkConfig.jwks_uri,
      registration_endpoint: clerkConfig.registration_endpoint,
      issuer: clerkConfig.issuer || `https://${clerkDomain}.clerk.accounts.dev`,
    });
  } catch (error) {
    console.error("Error fetching Clerk OIDC config:", error);
    return NextResponse.json(
      { error: "Failed to fetch OpenID configuration" },
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
