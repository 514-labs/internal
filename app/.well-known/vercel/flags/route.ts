import { createFlagsDiscoveryEndpoint } from "flags/next";
import { vercelFlagDefinitions } from "@/generated/hypertune";

export const GET = createFlagsDiscoveryEndpoint(() => {
  return { definitions: vercelFlagDefinitions };
});

// HEAD handler for endpoint discovery
export const HEAD = GET;

