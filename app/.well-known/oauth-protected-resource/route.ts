import {
  metadataCorsOptionsRequestHandler,
  protectedResourceHandlerClerk,
} from "@clerk/mcp-tools/next";
import { baseURL } from "../../../baseUrl";

const handler = protectedResourceHandlerClerk({
  // Specify which OAuth scopes this protected resource supports
  scopes_supported: ["profile", "email"],
  // Point to your MCP server endpoint
  resource: `${baseURL}/mcp`,
});

const corsHandler = metadataCorsOptionsRequestHandler();

export { handler as GET, corsHandler as OPTIONS };
