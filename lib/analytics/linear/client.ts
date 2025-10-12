/**
 * Linear client setup and configuration
 */

import { LinearClient } from "@linear/sdk";
import { ConfigurationError } from "../shared/errors";
import type { AnalyticsClient } from "../shared/types";
import { getValidLinearToken } from "../../integrations/linear-oauth";

let linearClient: LinearClient | null = null;
let lastTokenCheck: number = 0;
const TOKEN_CHECK_INTERVAL = 60000; // Check token every 60 seconds

/**
 * Initialize Linear client with configuration
 * Prefers OAuth token from database, falls back to API key
 */
export async function getLinearClient(): Promise<LinearClient> {
  const now = Date.now();

  // Check if we need to refresh the client (token might have been refreshed)
  if (linearClient && now - lastTokenCheck < TOKEN_CHECK_INTERVAL) {
    return linearClient;
  }

  lastTokenCheck = now;

  // Try to get OAuth token first
  try {
    const accessToken = await getValidLinearToken();

    if (accessToken) {
      linearClient = new LinearClient({ accessToken });
      return linearClient;
    }
  } catch (error) {
    // Re-throw database/migration errors with more context
    if (
      error instanceof Error &&
      error.message.includes("Database migration required")
    ) {
      throw new ConfigurationError(
        `Linear OAuth setup is incomplete:\n\n${error.message}\n\n` +
          `Alternatively, you can use a Linear API key:\n` +
          `  1. Get your API key from: https://linear.app/settings/api\n` +
          `  2. Add to .env.local: LINEAR_API_KEY=your_api_key_here\n` +
          `  3. Restart your dev server`
      );
    }

    // For other errors, log and continue to API key fallback
    console.error("Error checking Linear OAuth tokens:", error);
  }

  // Fallback to API key for backward compatibility
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError(
      "Linear is not configured.\n\n" +
        "You need to set up Linear authentication using ONE of these methods:\n\n" +
        "Option 1 - Linear API Key (Recommended for development):\n" +
        "  1. Get your API key from: https://linear.app/settings/api\n" +
        "  2. Add to .env.local: LINEAR_API_KEY=your_api_key_here\n" +
        "  3. Restart your dev server\n\n" +
        "Option 2 - Linear OAuth (For production):\n" +
        "  1. Ensure Supabase is running: pnpm db:start\n" +
        "  2. Run migrations: pnpm db:migrate\n" +
        "  3. Visit /settings/integrations to connect Linear\n\n" +
        "Current environment:\n" +
        `  - LINEAR_API_KEY: ${apiKey ? "✓ Set" : "✗ Not set"}\n` +
        `  - SUPABASE_URL: ${process.env.SUPABASE_URL || "✗ Not set"}`
    );
  }

  linearClient = new LinearClient({ apiKey });

  return linearClient;
}

/**
 * Force refresh of Linear client (useful after token refresh)
 */
export function resetLinearClient(): void {
  linearClient = null;
  lastTokenCheck = 0;
}

/**
 * Linear analytics client wrapper
 */
export class LinearAnalyticsClient implements AnalyticsClient {
  async healthCheck(): Promise<boolean> {
    try {
      const client = await getLinearClient();
      // Test connection by fetching viewer (current user)
      const viewer = await client.viewer;
      return !!viewer;
    } catch (error) {
      return false;
    }
  }

  getName(): string {
    return "Linear";
  }

  async getClient(): Promise<LinearClient> {
    return await getLinearClient();
  }
}

export const linearAnalyticsClient = new LinearAnalyticsClient();
