/**
 * Supabase client setup for database-only usage (PLACEHOLDER)
 *
 * NOTE: Supabase is used ONLY for database persistence.
 * All authentication is handled by Clerk.
 *
 * Setup Instructions:
 * 1. Install Supabase CLI: `brew install supabase/tap/supabase` or `pnpm add -g supabase`
 * 2. Initialize: `supabase init`
 * 3. Start local database: `supabase start`
 * 4. Access local database at http://localhost:54321
 *
 * For production, create a Supabase project and use the service role key
 * to bypass Supabase Auth (since we use Clerk).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ConfigurationError } from "../shared/errors";
import type { AnalyticsClient } from "../shared/types";

let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize Supabase client for database-only access
 *
 * Uses service role key to bypass Supabase Auth (Clerk handles auth)
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new ConfigurationError(
      "Supabase database is not configured.\n\n" +
        "To use the local Supabase database:\n" +
        "  1. Start local Supabase: pnpm db:start\n" +
        "  2. Add to .env.local:\n" +
        "     SUPABASE_URL=http://localhost:54321\n" +
        "     SUPABASE_SERVICE_ROLE_KEY=<service_role_key>\n" +
        "  3. Get service role key: pnpm db:status\n" +
        "  4. Restart your dev server\n\n" +
        "Current configuration:\n" +
        `  - SUPABASE_URL: ${url || "✗ Not set"}\n` +
        `  - SUPABASE_SERVICE_ROLE_KEY: ${
          serviceRoleKey ? "✓ Set" : "✗ Not set"
        }`
    );
  }

  // Use service role key to bypass Row Level Security (RLS)
  // since authentication is handled by Clerk
  supabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return supabaseClient;
}

/**
 * Supabase analytics client wrapper (database only)
 */
export class SupabaseAnalyticsClient implements AnalyticsClient {
  private client: SupabaseClient | null = null;

  constructor() {
    try {
      this.client = getSupabaseClient();
    } catch (error) {
      // Placeholder: client will be null if not configured
      console.warn("Supabase client not configured:", (error as Error).message);
    }
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;

    try {
      // Test connection with a simple query
      const { error } = await this.client
        .from("_health_check")
        .select("count")
        .limit(1);
      // It's ok if the table doesn't exist, we just want to test connection
      return !error || error.code === "PGRST116"; // PGRST116 = table not found
    } catch (error) {
      return false;
    }
  }

  getName(): string {
    return "Supabase";
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new ConfigurationError("Supabase client is not initialized");
    }
    return this.client;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }
}

export const supabaseAnalyticsClient = new SupabaseAnalyticsClient();

/**
 * FUTURE USE CASES (commented out - implement when needed):
 *
 * 1. Cache analytics query results:
 *    - Store expensive query results
 *    - Implement TTL-based cache invalidation
 *    - Speed up repeated queries
 *
 * 2. Store computed metrics:
 *    - Pre-aggregate frequently accessed data
 *    - Store daily/weekly/monthly rollups
 *    - Materialized views for dashboards
 *
 * 3. Store user preferences:
 *    - Dashboard configurations
 *    - Saved filters and views
 *    - Custom analytics settings
 *
 * 4. Audit logs:
 *    - Track who accessed what data
 *    - Monitor API usage
 *    - Compliance and security logging
 *
 * Example table structures can be found in supabase/migrations/
 */
