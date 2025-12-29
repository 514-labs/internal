/**
 * Goal types
 */

import type { GoalFrontmatter, KeyResult, MetricSource } from "@/lib/content/schemas";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import type { TocEntry } from "@/lib/content/types";

/**
 * Extended key result with hydrated current value
 */
export interface HydratedKeyResult extends KeyResult {
  /** The current value (fetched or from frontmatter) */
  current: number;
  /** Whether the value was fetched live from an integration */
  isLive: boolean;
  /** Whether the metric was manually overridden */
  isOverridden: boolean;
  /** Calculated progress percentage (0-100) */
  progress: number;
}

/**
 * Goal list item (for overview pages)
 */
export interface GoalListItem {
  slug: string;
  frontmatter: GoalFrontmatter;
  /** Calculated Key Results progress (0-100) */
  progress: number;
  /** Number of key results */
  keyResultCount: number;
  /** Calculated work/initiative progress (0-100) */
  workProgress: number;
  /** Number of linked initiatives/work items */
  workItemCount: number;
}

/**
 * Full goal with content
 */
export interface Goal {
  slug: string;
  filePath: string;
  frontmatter: GoalFrontmatter;
  content: string;
  html: string;
  mdxSource: MDXRemoteSerializeResult;
  toc: TocEntry[];
}

/**
 * Hydrated goal with calculated progress
 */
export interface HydratedGoal extends Goal {
  /** Hydrated key results with current values */
  keyResults: HydratedKeyResult[];
  /** Calculated Key Results progress (0-100) */
  progress: number;
  /** Whether any key results use live data */
  hasLiveData: boolean;
  /** Calculated work/initiative progress (0-100) */
  workProgress: number;
  /** Number of linked initiatives/work items */
  workItemCount: number;
}

/**
 * Goal filter options
 */
export interface GoalFilters {
  status?: GoalFrontmatter["status"];
  strategicDomain?: GoalFrontmatter["strategicDomain"];
  team?: string;
  owner?: string;
  timeframe?: string;
}

/**
 * Strategic domain type
 */
export type StrategicDomain =
  | "product-development"
  | "customer-development"
  | "company"    // Anchor company-level goals
  | "plm"        // Product-Led Marketing
  | "slg"        // Sales-Led Growth
  | "awareness"  // Partner-led awareness
  | "platform";  // Platform & execution

