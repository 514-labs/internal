/**
 * Metric types for the metrics fetching layer
 */

import type { MetricSource as MetricSourceSchema } from "@/lib/content/schemas";

/**
 * Re-export the metric source schema type
 */
export type MetricSource = MetricSourceSchema;

/**
 * Metric value with metadata
 */
export interface MetricValue {
  value: number;
  source: string;
  timestamp: string;
  isLive: boolean;
}

/**
 * Aggregation types for derived metrics
 */
export type AggregationType = "count" | "sum" | "average" | "min" | "max" | "percentage";

/**
 * Derived metric configuration
 */
export interface DerivedMetricConfig {
  sourceEntity: string;
  aggregation: AggregationType;
  filter?: Record<string, unknown>;
  field?: string;
}

/**
 * PostHog metric types
 */
export type PostHogMetricType = "dau" | "mau" | "events" | "conversions" | "journeyCompletion";

/**
 * Linear metric types (derived from entities)
 */
export type LinearMetricType = "issuesCompleted" | "projectProgress" | "initiativeProgress";

/**
 * Mercury metric types (derived from entities)
 */
export type MercuryMetricType = "revenue" | "cashBalance" | "mrr";

/**
 * HubSpot metric types (derived from entities)
 */
export type HubSpotMetricType = "deals" | "contacts" | "pipelineValue";


