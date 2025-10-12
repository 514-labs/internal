#!/usr/bin/env ts-node
/**
 * HubSpot Data Warehouse Discovery Script (via PostHog)
 *
 * This script helps discover HubSpot data available in PostHog's data warehouse.
 *
 * Usage:
 *   pnpm tsx scripts/analytics/discover-hubspot.ts
 *   pnpm tsx scripts/analytics/discover-hubspot.ts --table contacts
 *   pnpm tsx scripts/analytics/discover-hubspot.ts --table deals --limit 10
 */

import { posthogAnalyticsClient } from "../../lib/analytics/posthog/client";
import { queryHubspotData } from "../../lib/analytics/posthog/queries";

interface DiscoveryOptions {
  table?: string;
  limit?: number;
}

async function discoverHubSpot(options: DiscoveryOptions = {}) {
  console.log("🔍 HubSpot Data Warehouse Discovery (via PostHog)\n");

  // Check if PostHog is configured
  const isHealthy = await posthogAnalyticsClient.healthCheck();
  if (!isHealthy) {
    console.error("❌ Failed to connect to PostHog");
    console.error("Set the following environment variables:");
    console.error("  - POSTHOG_API_KEY");
    console.error("  - POSTHOG_PROJECT_ID");
    console.error("  - POSTHOG_HOST (optional)");
    process.exit(1);
  }
  console.log("✅ Connected to PostHog\n");

  try {
    if (options.table) {
      // Discover specific table
      await discoverTable(options.table, options.limit);
    } else {
      // List common HubSpot tables
      await listCommonTables();
    }
  } catch (error) {
    console.error("❌ Error during discovery:", (error as Error).message);
    console.error(
      "\nNote: Make sure HubSpot is connected to PostHog's data warehouse"
    );
    process.exit(1);
  }
}

async function listCommonTables() {
  console.log("📊 Common HubSpot Tables:\n");

  const commonTables = [
    {
      name: "hubspot_contacts",
      description: "Contact records from HubSpot CRM",
    },
    {
      name: "hubspot_companies",
      description: "Company records from HubSpot CRM",
    },
    { name: "hubspot_deals", description: "Deal/opportunity records" },
    { name: "hubspot_tickets", description: "Support ticket records" },
    { name: "hubspot_emails", description: "Email engagement data" },
    { name: "hubspot_meetings", description: "Meeting/calendar data" },
    { name: "hubspot_calls", description: "Call activity records" },
    { name: "hubspot_tasks", description: "Task records" },
    { name: "hubspot_notes", description: "Notes and activities" },
    { name: "hubspot_products", description: "Product catalog" },
    { name: "hubspot_line_items", description: "Deal line items" },
  ];

  for (const table of commonTables) {
    console.log(`  • ${table.name}`);
    console.log(`    ${table.description}`);
    console.log();
  }

  console.log("💡 To explore a specific table:");
  console.log(
    "   pnpm tsx scripts/analytics/discover-hubspot.ts --table <name> --limit 10"
  );
  console.log(
    "\n💡 Note: Actual table names may vary based on your PostHog data warehouse setup"
  );
}

async function discoverTable(tableName: string, limit: number = 5) {
  console.log(`📋 Table: ${tableName}\n`);

  // Try to get schema by querying with LIMIT 0
  console.log("🔧 Discovering schema...\n");

  try {
    const query = `DESCRIBE ${tableName}`;
    const schemaResult = await posthogAnalyticsClient.executeHogQL(query);
    console.log("Schema:");
    console.log(JSON.stringify(schemaResult, null, 2));
    console.log();
  } catch (error) {
    console.log(
      "ℹ️  Schema discovery not available, fetching sample data instead...\n"
    );
  }

  // Get sample data
  console.log(`📊 Sample Data (${limit} rows):\n`);

  try {
    const samples = await queryHubspotData(tableName, {
      limit,
      offset: 0,
      sortOrder: "desc" as const,
    });

    if (samples.length === 0) {
      console.log("  (no data)");
    } else {
      console.log(`Found ${samples.length} rows:\n`);

      // Show first row in detail
      if (samples.length > 0) {
        console.log("First row (detailed):");
        console.log(JSON.stringify(samples[0], null, 2));
        console.log();
      }

      // Show all rows as table
      if (samples.length > 1) {
        console.log("All rows (table view):");
        console.table(samples);
      }
    }
  } catch (error) {
    console.error("Error fetching sample data:", (error as Error).message);
    console.log("\n💡 The table might not exist or have a different name.");
    console.log("Run without --table to see common table names.");
  }
}

// Parse command line arguments
function parseArgs(): DiscoveryOptions {
  const args = process.argv.slice(2);
  const options: DiscoveryOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--table" && args[i + 1]) {
      options.table = args[i + 1];
      i++;
    } else if (arg === "--limit" && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    }
  }

  return options;
}

// Run discovery
const options = parseArgs();
discoverHubSpot(options);
