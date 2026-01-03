/**
 * Entity types for the entity fetching layer
 */

/**
 * Base entity interface
 */
export interface Entity {
  id: string;
  [key: string]: unknown;
}

/**
 * Entity source types
 */
export type EntitySource = "linear" | "rippling" | "mercury" | "posthog" | "hubspot";

/**
 * Entity type names by source
 */
export type LinearEntityType = "issue" | "project" | "initiative" | "team" | "cycle" | "user";
export type RipplingEntityType = "user" | "worker" | "team" | "department" | "company" | "workLocation";
export type MercuryEntityType = "account" | "transaction" | "recipient" | "organization" | "user" | "treasury";
export type PostHogEntityType = "event" | "person" | "session" | "journey";
export type HubSpotEntityType = "deal" | "contact" | "company";

/**
 * Entity configuration for fetching
 */
export interface EntityConfig<S extends EntitySource = EntitySource> {
  source: S;
  type: S extends "linear"
    ? LinearEntityType
    : S extends "rippling"
    ? RipplingEntityType
    : S extends "mercury"
    ? MercuryEntityType
    : S extends "posthog"
    ? PostHogEntityType
    : S extends "hubspot"
    ? HubSpotEntityType
    : string;
  filters?: Record<string, unknown>;
}

/**
 * Linear entity types
 */
export interface LinearIssue extends Entity {
  title: string;
  state: { name: string; type: string };
  priority: number;
  project?: { id: string; name: string };
  team?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface LinearProject extends Entity {
  name: string;
  description?: string;
  progress: number;
  state: string;
  startDate?: string;
  targetDate?: string;
}

export interface LinearInitiative extends Entity {
  name: string;
  description?: string;
  status: string;
  projects: { id: string; name: string }[];
}

export interface LinearTeam extends Entity {
  name: string;
  key: string;
  description?: string;
}

/**
 * Rippling entity types
 */
export interface RipplingWorker extends Entity {
  firstName: string;
  lastName: string;
  email: string;
  department?: { id: string; name: string };
  team?: { id: string; name: string };
  startDate?: string;
  employmentType?: string;
}

export interface RipplingTeam extends Entity {
  name: string;
  description?: string;
  manager?: { id: string; name: string };
  memberCount?: number;
}

export interface RipplingDepartment extends Entity {
  name: string;
  parentDepartment?: { id: string; name: string };
}

/**
 * Mercury entity types
 */
export interface MercuryAccount extends Entity {
  name: string;
  type: string;
  currentBalance: number;
  availableBalance: number;
  currency: string;
}

export interface MercuryTransaction extends Entity {
  amount: number;
  counterpartyName: string;
  status: string;
  postedDate?: string;
  createdAt: string;
  isRecurring?: boolean;
}

/**
 * HubSpot entity types (re-export from connector)
 */
export type { HubSpotDeal, HubSpotContact, HubSpotCompany } from "../connectors/hubspot/client";


