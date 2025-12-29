/**
 * Shared types for source connectors
 * Re-exports from the original analytics shared types for backwards compatibility
 */

export {
  QueryOptionsSchema,
  type QueryOptions,
  type ApiResponse,
  type AnalyticsClient,
  type PaginationMeta,
  createPaginationMeta,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/analytics/shared/types";

/**
 * Source types for connectors
 *
 * ENTITIES: Structured records/objects fetched from connectors
 * - Used for: filtering, linking, org structure, raw data
 * - Examples: users, teams, deals, projects, transactions
 *
 * METRICS: Computed/aggregated values derived from entities
 * - Used for: key result progress tracking
 * - Examples: MRR (from transactions), DAU (from events), issuesCompleted (from issues)
 *
 * DIRECT METRICS (exceptions): Pre-computed analytics from PostHog insights/trends
 */

export type SourceType = "entity" | "metric";

export interface EntityDefinition {
  name: string;
  endpoint: string;
  description: string;
}

export interface DerivedMetric {
  name: string;
  sourceEntity: string;
  computation: string;
}

export interface ConnectorDefinition {
  id: string;
  name: string;
  entities: EntityDefinition[];
  derivedMetrics: DerivedMetric[];
  directMetricEndpoints?: string[]; // Exceptions only (e.g., PostHog insights)
}

export const CONNECTOR_DEFINITIONS: Record<string, ConnectorDefinition> = {
  rippling: {
    id: "rippling",
    name: "Rippling",
    entities: [
      { name: "User", endpoint: "/users", description: "User records" },
      { name: "Worker", endpoint: "/workers", description: "Worker records" },
      { name: "Team", endpoint: "/teams", description: "Team structures" },
      { name: "Department", endpoint: "/departments", description: "Department hierarchy" },
      { name: "Company", endpoint: "/companies", description: "Company info" },
    ],
    derivedMetrics: [
      { name: "headcount", sourceEntity: "Worker", computation: "count" },
      { name: "teamSize", sourceEntity: "Worker", computation: "count by team" },
    ],
  },
  mercury: {
    id: "mercury",
    name: "Mercury",
    entities: [
      { name: "Account", endpoint: "/accounts", description: "Bank accounts" },
      { name: "Transaction", endpoint: "/transactions", description: "Transaction records" },
      { name: "Recipient", endpoint: "/recipients", description: "Payment recipients" },
      { name: "TreasuryAccount", endpoint: "/treasury", description: "Treasury accounts" },
    ],
    derivedMetrics: [
      { name: "cashBalance", sourceEntity: "Account", computation: "sum of balances" },
      { name: "mrr", sourceEntity: "Transaction", computation: "sum recurring in period" },
      { name: "runway", sourceEntity: "Transaction", computation: "balance / avg monthly burn" },
    ],
  },
  linear: {
    id: "linear",
    name: "Linear",
    entities: [
      { name: "Issue", endpoint: "/issues", description: "Issue records" },
      { name: "Project", endpoint: "/projects", description: "Project records" },
      { name: "Initiative", endpoint: "/initiatives", description: "Initiative records" },
      { name: "Team", endpoint: "/teams", description: "Team records" },
      { name: "Cycle", endpoint: "/cycles", description: "Sprint/cycle records" },
    ],
    derivedMetrics: [
      { name: "issuesCompleted", sourceEntity: "Issue", computation: "count where completed" },
      { name: "projectProgress", sourceEntity: "Issue", computation: "completed / total in project" },
      { name: "initiativeProgress", sourceEntity: "Project", computation: "avg project progress" },
    ],
  },
  posthog: {
    id: "posthog",
    name: "PostHog",
    entities: [
      { name: "Event", endpoint: "/events", description: "Raw event records" },
      { name: "Person", endpoint: "/persons", description: "Person/user records" },
      { name: "Session", endpoint: "/sessions", description: "Session records" },
      { name: "Journey", endpoint: "/journeys", description: "Journey definitions" },
    ],
    derivedMetrics: [
      { name: "mau", sourceEntity: "Person", computation: "distinct with events in 30d" },
      { name: "dau", sourceEntity: "Person", computation: "distinct with events in 1d" },
      { name: "journeyCompletion", sourceEntity: "Event", computation: "completed / started" },
      { name: "conversionRate", sourceEntity: "Event", computation: "converted / total" },
    ],
    directMetricEndpoints: ["/insights", "/trends"],
  },
  hubspot: {
    id: "hubspot",
    name: "HubSpot",
    entities: [
      { name: "Deal", endpoint: "/deals", description: "Deal records" },
      { name: "Contact", endpoint: "/contacts", description: "Contact records" },
      { name: "Company", endpoint: "/companies", description: "Company records" },
    ],
    derivedMetrics: [
      { name: "dealsWon", sourceEntity: "Deal", computation: "count where closed-won" },
      { name: "pipelineValue", sourceEntity: "Deal", computation: "sum of amounts" },
      { name: "qualifiedLeads", sourceEntity: "Contact", computation: "count where qualified" },
    ],
  },
};

