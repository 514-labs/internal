/**
 * Rippling client setup and configuration
 */

import { ConfigurationError } from "../shared/errors";
import type { AnalyticsClient } from "../shared/types";

/**
 * Rippling API client using native fetch
 */
export class RipplingAnalyticsClient implements AnalyticsClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.RIPPLING_API_KEY;
    const baseUrl = process.env.RIPPLING_API_URL || "https://api.rippling.com";

    if (!apiKey) {
      throw new ConfigurationError(
        "Rippling API key is not configured. Set RIPPLING_API_KEY environment variable."
      );
    }

    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<boolean> {
    try {
      // Test connection by making a simple API call
      const response = await this.fetch("/company");
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  getName(): string {
    return "Rippling";
  }

  /**
   * Make authenticated request to Rippling API
   */
  async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`;

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  /**
   * Make GET request and parse JSON response
   */
  async get<T>(path: string): Promise<T> {
    const response = await this.fetch(path);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rippling API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Make POST request with JSON body
   */
  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await this.fetch(path, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Rippling API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}

export const ripplingAnalyticsClient = new RipplingAnalyticsClient();
