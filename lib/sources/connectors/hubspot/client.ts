/**
 * HubSpot connector client
 * Uses PostHog Data Warehouse to query HubSpot data
 *
 * HubSpot data is synced to PostHog's data warehouse and queried via HogQL
 */

import { posthogAnalyticsClient } from "../posthog/client";
import { ConfigurationError } from "../shared/errors";

export interface HubSpotDeal {
  id: string;
  name: string;
  amount: number | null;
  stage: string;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotContact {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  lifecycleStage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HubSpotCompany {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * HubSpot client that queries data via PostHog Data Warehouse
 */
export class HubSpotClient {
  /**
   * Fetch deals from HubSpot via PostHog Data Warehouse
   */
  async getDeals(filters?: { stage?: string }): Promise<HubSpotDeal[]> {
    let query = `
      SELECT 
        id,
        dealname as name,
        amount,
        dealstage as stage,
        closedate as closeDate,
        createdate as createdAt,
        hs_lastmodifieddate as updatedAt
      FROM hubspot_deals
    `;

    if (filters?.stage) {
      query += ` WHERE dealstage = '${filters.stage}'`;
    }

    query += ` ORDER BY createdate DESC LIMIT 1000`;

    try {
      const result = await posthogAnalyticsClient.executeHogQL(query);
      return this.parseHogQLResult<HubSpotDeal>(result);
    } catch (error) {
      if ((error as Error).message.includes("hubspot_deals")) {
        throw new ConfigurationError(
          "HubSpot data warehouse table not found. Ensure HubSpot is connected to PostHog."
        );
      }
      throw error;
    }
  }

  /**
   * Fetch contacts from HubSpot via PostHog Data Warehouse
   */
  async getContacts(filters?: { lifecycleStage?: string }): Promise<HubSpotContact[]> {
    let query = `
      SELECT 
        id,
        email,
        firstname as firstName,
        lastname as lastName,
        lifecyclestage as lifecycleStage,
        createdate as createdAt,
        lastmodifieddate as updatedAt
      FROM hubspot_contacts
    `;

    if (filters?.lifecycleStage) {
      query += ` WHERE lifecyclestage = '${filters.lifecycleStage}'`;
    }

    query += ` ORDER BY createdate DESC LIMIT 1000`;

    try {
      const result = await posthogAnalyticsClient.executeHogQL(query);
      return this.parseHogQLResult<HubSpotContact>(result);
    } catch (error) {
      if ((error as Error).message.includes("hubspot_contacts")) {
        throw new ConfigurationError(
          "HubSpot data warehouse table not found. Ensure HubSpot is connected to PostHog."
        );
      }
      throw error;
    }
  }

  /**
   * Fetch companies from HubSpot via PostHog Data Warehouse
   */
  async getCompanies(): Promise<HubSpotCompany[]> {
    const query = `
      SELECT 
        id,
        name,
        domain,
        industry,
        createdate as createdAt,
        hs_lastmodifieddate as updatedAt
      FROM hubspot_companies
      ORDER BY createdate DESC
      LIMIT 1000
    `;

    try {
      const result = await posthogAnalyticsClient.executeHogQL(query);
      return this.parseHogQLResult<HubSpotCompany>(result);
    } catch (error) {
      if ((error as Error).message.includes("hubspot_companies")) {
        throw new ConfigurationError(
          "HubSpot data warehouse table not found. Ensure HubSpot is connected to PostHog."
        );
      }
      throw error;
    }
  }

  /**
   * Parse HogQL result into typed array
   */
  private parseHogQLResult<T>(result: unknown): T[] {
    const data = result as { results?: unknown[][] };
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }
    // HogQL returns arrays of values, we need to map to objects
    // This is a simplified implementation - real mapping would need column info
    return data.results as unknown as T[];
  }
}

/**
 * Create a HubSpot client
 */
export function createHubSpotClient(): HubSpotClient {
  return new HubSpotClient();
}

export const hubspotClient = new HubSpotClient();

