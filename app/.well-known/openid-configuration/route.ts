import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

/**
 * OpenID Connect Discovery Endpoint (RFC 8414)
 *
 * Alternative to /.well-known/oauth-authorization-server
 * Some OAuth clients prefer the OIDC discovery path.
 *
 * Both endpoints return the same Clerk OAuth metadata.
 */
const handler = authServerMetadataHandlerClerk();

const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, handler as HEAD, corsHandler as OPTIONS };

