/**
 * HubSpot entity fetching
 */

import { hubspotClient } from "../connectors/hubspot/client";
import type { HubSpotDeal, HubSpotContact, HubSpotCompany } from "../connectors/hubspot/client";
import type { Entity } from "./types";

/**
 * Fetch HubSpot deals
 */
export async function fetchHubSpotDeals(filters?: {
  stage?: string;
}): Promise<HubSpotDeal[]> {
  return hubspotClient.getDeals(filters);
}

/**
 * Fetch HubSpot contacts
 */
export async function fetchHubSpotContacts(filters?: {
  lifecycleStage?: string;
}): Promise<HubSpotContact[]> {
  return hubspotClient.getContacts(filters);
}

/**
 * Fetch HubSpot companies
 */
export async function fetchHubSpotCompanies(): Promise<HubSpotCompany[]> {
  return hubspotClient.getCompanies();
}

/**
 * Generic HubSpot entity fetcher
 */
export async function fetchHubSpotEntity(
  type: string,
  filters?: Record<string, unknown>
): Promise<Entity[]> {
  switch (type) {
    case "deal":
      return fetchHubSpotDeals(filters as { stage?: string }) as unknown as Entity[];
    case "contact":
      return fetchHubSpotContacts(filters as { lifecycleStage?: string }) as unknown as Entity[];
    case "company":
      return fetchHubSpotCompanies() as unknown as Entity[];
    default:
      throw new Error(`Unknown HubSpot entity type: ${type}`);
  }
}

