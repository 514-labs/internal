/**
 * PostHog client setup and configuration
 */

import { PostHog } from "posthog-node";
import { ConfigurationError } from "../shared/errors";
import type { AnalyticsClient } from "../shared/types";

let posthogClient: PostHog | null = null;

/**
 * Initialize PostHog client with configuration
 */
export function getPostHogClient(): PostHog {
  if (posthogClient) {
    return posthogClient;
  }

  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || "https://app.posthog.com";

  if (!apiKey) {
    // In test environment, use a placeholder
    if (process.env.NODE_ENV === "test") {
      posthogClient = new PostHog("test_posthog_key", { host });
      return posthogClient;
    }

    throw new ConfigurationError(
      "PostHog API key is not configured. Set POSTHOG_API_KEY environment variable."
    );
  }

  posthogClient = new PostHog(apiKey, {
    host,
  });

  return posthogClient;
}

/**
 * PostHog analytics client wrapper
 */
export class PostHogAnalyticsClient implements AnalyticsClient {
  private client: PostHog;

  constructor() {
    this.client = getPostHogClient();
  }

  async healthCheck(): Promise<boolean> {
    try {
      // PostHog client doesn't have a health check, but we can verify it's initialized
      return this.client !== null;
    } catch (error) {
      return false;
    }
  }

  getName(): string {
    return "PostHog";
  }

  getClient(): PostHog {
    return this.client;
  }

  /**
   * Execute HogQL query (for data warehouse queries including HubSpot)
   * Note: This requires PostHog API access and proper configuration
   */
  async executeHogQL(query: string): Promise<unknown> {
    const projectId = process.env.POSTHOG_PROJECT_ID;
    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || "https://app.posthog.com";

    if (!projectId) {
      throw new ConfigurationError(
        "PostHog project ID is not configured. Set POSTHOG_PROJECT_ID environment variable."
      );
    }

    // Execute HogQL query via API
    const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`PostHog HogQL query failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Shutdown client gracefully
   */
  async shutdown(): Promise<void> {
    await this.client.shutdown();
  }
}

export const posthogAnalyticsClient = new PostHogAnalyticsClient();
