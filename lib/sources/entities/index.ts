/**
 * Entity fetching layer
 *
 * All connectors expose entities. This layer provides a unified interface
 * for fetching entities from any source.
 */

import { fetchLinearEntity, fetchLinearIssues, fetchLinearProjects, fetchLinearInitiatives, fetchLinearTeams } from "./linear";
import { fetchRipplingEntity, fetchRipplingWorkers, fetchRipplingTeams, fetchRipplingDepartments } from "./rippling";
import { fetchMercuryEntity, fetchMercuryAccounts, fetchMercuryTransactions } from "./mercury";
import { fetchHubSpotEntity, fetchHubSpotDeals, fetchHubSpotContacts, fetchHubSpotCompanies } from "./hubspot";
import type { Entity, EntityConfig, EntitySource } from "./types";

/**
 * Unified entity fetcher
 *
 * Fetches entities from any configured source using a consistent interface.
 *
 * @param config - Entity configuration including source, type, and filters
 * @param userId - User ID for sources that require authentication (Rippling, Mercury)
 * @returns Array of entities
 */
export async function fetchEntity<T extends Entity = Entity>(
  config: EntityConfig,
  userId?: string
): Promise<T[]> {
  switch (config.source) {
    case "linear":
      return fetchLinearEntity(config.type, config.filters) as Promise<T[]>;

    case "rippling":
      if (!userId) {
        throw new Error("userId is required for Rippling entities");
      }
      return fetchRipplingEntity(userId, config.type, config.filters) as Promise<T[]>;

    case "mercury":
      if (!userId) {
        throw new Error("userId is required for Mercury entities");
      }
      return fetchMercuryEntity(userId, config.type, config.filters) as Promise<T[]>;

    case "hubspot":
      return fetchHubSpotEntity(config.type, config.filters) as Promise<T[]>;

    case "posthog":
      // PostHog entities would be implemented here
      throw new Error("PostHog entity fetching not yet implemented");

    default:
      throw new Error(`Unknown entity source: ${config.source}`);
  }
}

// Convenience exports for specific entity types
export {
  // Linear
  fetchLinearIssues,
  fetchLinearProjects,
  fetchLinearInitiatives,
  fetchLinearTeams,
  // Rippling
  fetchRipplingWorkers,
  fetchRipplingTeams,
  fetchRipplingDepartments,
  // Mercury
  fetchMercuryAccounts,
  fetchMercuryTransactions,
  // HubSpot
  fetchHubSpotDeals,
  fetchHubSpotContacts,
  fetchHubSpotCompanies,
};

// Type exports
export * from "./types";


