import "server-only";
import { createClient } from "@vercel/edge-config";
import { VercelEdgeConfigInitDataProvider } from "hypertune";
import { unstable_noStore as noStore } from "next/cache";
import { createSource } from "@/generated/hypertune";
import { getVercelOverride } from "@/generated/hypertune.vercel";

const hypertuneSource = createSource({
  token: process.env.NEXT_PUBLIC_HYPERTUNE_TOKEN!,
  initDataProvider:
    process.env.EDGE_CONFIG && process.env.EDGE_CONFIG_HYPERTUNE_ITEM_KEY
      ? new VercelEdgeConfigInitDataProvider({
          edgeConfigClient: createClient(process.env.EDGE_CONFIG),
          itemKey: process.env.EDGE_CONFIG_HYPERTUNE_ITEM_KEY,
        })
      : undefined,
});

export default async function getHypertune({
  isRouteHandler = false,
}: {
  isRouteHandler?: boolean;
} = {}) {
  noStore();

  await hypertuneSource.initIfNeeded();

  // Respect flag overrides set by the Vercel Toolbar
  hypertuneSource.setOverride(await getVercelOverride());

  hypertuneSource.setRemoteLoggingMode(isRouteHandler ? "normal" : "off");

  return hypertuneSource.root({
    args: {
      context: {
        environment:
          process.env.NODE_ENV === "production" ? "production" : "development",
        user: { id: "", name: "", email: "" },
      },
    },
  });
}

