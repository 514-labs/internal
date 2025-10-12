#!/usr/bin/env ts-node
/**
 * Generic Data Sampling Script
 *
 * Sample data from any analytics source for inspection
 *
 * Usage:
 *   pnpm tsx scripts/analytics/sample-data.ts --source hubspot --table contacts --limit 5
 *   pnpm tsx scripts/analytics/sample-data.ts --source linear --type issues --limit 20
 */

import { queryHubspotData } from "../../lib/analytics/posthog/queries";
import { getIssues } from "../../lib/analytics/linear/queries";

interface SampleOptions {
  source: "hubspot" | "linear";
  table?: string;
  type?: string;
  limit?: number;
}

async function sampleData(options: SampleOptions) {
  console.log(`🔍 Sampling data from ${options.source}\n`);

  try {
    let data: unknown[] = [];

    switch (options.source) {
      case "hubspot":
        if (!options.table) {
          console.error("❌ --table is required for HubSpot");
          process.exit(1);
        }
        data = await queryHubspotData(options.table, {
          limit: options.limit || 10,
          offset: 0,
          sortOrder: "desc" as const,
        });
        break;

      case "linear":
        const linearType = options.type || "issues";
        if (linearType === "issues") {
          data = await getIssues({
            limit: options.limit || 10,
          });
        } else {
          console.error(`❌ Unknown Linear type: ${linearType}`);
          console.error("Available types: issues");
          process.exit(1);
        }
        break;

      default:
        console.error(`❌ Unknown source: ${options.source}`);
        console.error("Available sources: hubspot, linear");
        process.exit(1);
    }

    console.log(`📊 Found ${data.length} rows\n`);

    if (data.length === 0) {
      console.log("  (no data)");
      return;
    }

    // Show first row in detail
    console.log("First row (detailed):");
    console.log(JSON.stringify(data[0], null, 2));
    console.log();

    // Show all rows as table
    if (data.length > 1) {
      console.log("All rows (table view):");
      console.table(data);
    }
  } catch (error) {
    console.error("❌ Error sampling data:", (error as Error).message);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs(): SampleOptions {
  const args = process.argv.slice(2);
  const options: Partial<SampleOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--source" && args[i + 1]) {
      options.source = args[i + 1] as SampleOptions["source"];
      i++;
    } else if (arg === "--table" && args[i + 1]) {
      options.table = args[i + 1];
      i++;
    } else if (arg === "--type" && args[i + 1]) {
      options.type = args[i + 1];
      i++;
    } else if (arg === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (arg === "--database" && args[i + 1]) {
      options.database = args[i + 1];
      i++;
    }
  }

  if (!options.source) {
    console.error("❌ --source is required");
    console.error("Available sources: hubspot, linear");
    process.exit(1);
  }

  return options as SampleOptions;
}

// Run sampling
const options = parseArgs();
sampleData(options);
