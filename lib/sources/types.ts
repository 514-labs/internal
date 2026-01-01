/**
 * Client-safe types for the sources library
 *
 * This module exports only types (no runtime code) so it can be safely
 * imported in client components.
 */

// Entity types
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

// Metric types
export type { MetricSource, MetricValue } from "./metrics/types";

// Connector types
export type { ConnectorDefinition } from "./connectors/shared/types";

