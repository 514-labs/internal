import { createHypertuneAdapter } from "@flags-sdk/hypertune";
import { createClient } from "@vercel/edge-config";
import { Identify } from "flags";
import { dedupe, flag } from "flags/next";
import { VercelEdgeConfigInitDataProvider } from "hypertune";
import {
  createSource,
  flagFallbacks,
  vercelFlagDefinitions as flagDefinitions,
  Context,
  FlagValues,
} from "./generated/hypertune";

const identify: Identify<Context> = dedupe(async ({ headers, cookies }) => {
  // TODO: Replace with actual user identification from Clerk
  return {
    environment: process.env.NODE_ENV as Context["environment"],
    user: {
      id: "",
      name: "",
      email: "",
    },
  };
});

const hypertuneAdapter = createHypertuneAdapter<FlagValues, Context>({
  createSource,
  flagFallbacks,
  flagDefinitions,
  identify,
  createSourceOptions: {
    initDataProvider: process.env.EDGE_CONFIG
      ? new VercelEdgeConfigInitDataProvider({
          edgeConfigClient: createClient(process.env.EDGE_CONFIG),
          itemKey: process.env.EDGE_CONFIG_HYPERTUNE_ITEM_KEY ?? "hypertune_7598",
        })
      : undefined,
  },
});

export const experimentalFlag = flag(hypertuneAdapter.declarations.experimental);

export const exampleFlagFlag = flag(hypertuneAdapter.declarations.exampleFlag);

