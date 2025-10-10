// OAuth 2.0 Authorization Server Metadata endpoint (RFC 8414)
// This is an alias to the OpenID Configuration endpoint for compatibility
// with both OAuth 2.0 and OpenID Connect discovery

import {
  authServerMetadataHandlerClerk,
  metadataCorsOptionsRequestHandler,
} from "@clerk/mcp-tools/next";

const handler = authServerMetadataHandlerClerk();
const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
