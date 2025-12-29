/**
 * Source connectors index
 *
 * All connectors expose entities. Metrics are derived from entities.
 *
 * Connector → Entities → Metrics (computed/aggregated)
 */

// Connector re-exports
export * from "./linear";
export * from "./rippling";
export * from "./mercury";
export * from "./posthog";
export * from "./hubspot";

// Shared utilities
export * from "./shared";

