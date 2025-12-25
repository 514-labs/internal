// Mock implementation of @clerk/mcp-tools/next for testing

export const protectedResourceHandlerClerk = (config: {
  scopes_supported?: string[];
  resource?: string;
}) => {
  return (req: Request) => {
    const origin = new URL(req.url).origin;
    const clerkDomain = "testing-clerk-domain.clerk.accounts.dev";

    return new Response(
      JSON.stringify({
        resource: config.resource || `${origin}/mcp`,
        authorization_servers: [`https://${clerkDomain}`],
        scopes_supported: config.scopes_supported || ["profile", "email"],
        token_types_supported: [
          "urn:ietf:params:oauth:token-type:access_token",
        ],
        jwks_uri: `https://${clerkDomain}/.well-known/jwks.json`,
        authorization_data_types_supported: ["oauth_scope"],
        authorization_data_locations_supported: ["header", "body"],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "max-age=3600",
        },
      }
    );
  };
};

export const authServerMetadataHandlerClerk = () => {
  return async () => {
    const clerkDomain = "testing-clerk-domain.clerk.accounts.dev";

    return new Response(
      JSON.stringify({
        issuer: `https://${clerkDomain}`,
        authorization_endpoint: `https://${clerkDomain}/oauth/authorize`,
        token_endpoint: `https://${clerkDomain}/oauth/token`,
        jwks_uri: `https://${clerkDomain}/.well-known/jwks.json`,
        registration_endpoint: `https://${clerkDomain}/oauth/register`,
        response_types_supported: ["code"],
        grant_types_supported: ["authorization_code", "refresh_token"],
        code_challenge_methods_supported: ["S256"],
        scopes_supported: ["openid", "profile", "email"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        token_endpoint_auth_methods_supported: [
          "client_secret_basic",
          "client_secret_post",
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Cache-Control": "max-age=3600",
        },
      }
    );
  };
};

export const metadataCorsOptionsRequestHandler = () => {
  return () => {
    return new Response(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  };
};

export const verifyClerkToken = jest.fn();

// Alias for openid-configuration endpoint (same as authServerMetadataHandlerClerk)
export const oidcConfigHandlerClerk = authServerMetadataHandlerClerk;
