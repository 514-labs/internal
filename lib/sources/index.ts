/**
 * Sources Library (Server-only)
 *
 * Unified interface for fetching entities and metrics from external sources.
 * This module contains server-side functions that use Node.js APIs.
 *
 * For client components, import types from "@/lib/sources/types" instead.
 *
 * Architecture:
 * - All connectors expose entities
 * - Metrics are derived from entities
 * - Direct metric endpoints (like PostHog insights) are exceptions
 *
 * Usage:
 * ```ts
 * // Server components / API routes:
 * import { fetchEntity, fetchMetric } from "@/lib/sources";
 *
 * // Client components (types only):
 * import type { LinearInitiative } from "@/lib/sources/types";
 * ```
 */

import "server-only";

// Entity layer
export {
  fetchEntity,
  fetchLinearIssues,
  fetchLinearProjects,
  fetchLinearInitiatives,
  fetchLinearTeams,
  fetchRipplingWorkers,
  fetchRipplingTeams,
  fetchRipplingDepartments,
  fetchMercuryAccounts,
  fetchMercuryTransactions,
  fetchHubSpotDeals,
  fetchHubSpotContacts,
  fetchHubSpotCompanies,
} from "./entities";

// Metric layer
export {
  fetchMetric,
  fetchPostHogMetric,
  fetchMercuryMetric,
  fetchAggregatedMetric,
} from "./metrics";

// Types
export type {
  Entity,
  EntityConfig,
  EntitySource,
  LinearIssue,
  LinearProject,
  LinearInitiative,
  LinearTeam,
  RipplingWorker,
  RipplingTeam,
  RipplingDepartment,
  MercuryAccount,
  MercuryTransaction,
  HubSpotDeal,
  HubSpotContact,
  HubSpotCompany,
} from "./entities/types";

export type { MetricSource, MetricValue } from "./metrics/types";

// Connector definitions (for UI/documentation)
export { CONNECTOR_DEFINITIONS, type ConnectorDefinition } from "./connectors/shared/types";

