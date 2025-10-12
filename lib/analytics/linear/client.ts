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
  const accessToken = await getValidLinearToken();

  if (accessToken) {
    linearClient = new LinearClient({ accessToken });
    return linearClient;
  }

  // Fallback to API key for backward compatibility
  const apiKey = process.env.LINEAR_API_KEY;

  if (!apiKey) {
    throw new ConfigurationError(
      "Linear is not configured. Either connect via OAuth or set LINEAR_API_KEY environment variable."
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
