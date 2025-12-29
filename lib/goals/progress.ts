/**
 * Goal progress calculation (Server-only)
 *
 * Calculates progress for goals and key results, including
 * hydrating key results with live metric values.
 *
 * For client-safe progress utilities, use ./progress-utils.ts
 */

import "server-only";

import { fetchMetric } from "@/lib/sources";
import type { KeyResult } from "@/lib/content/schemas";
import type { HydratedKeyResult, Goal, HydratedGoal } from "./types";

// Re-export client-safe utilities
export {
  calculateKeyResultProgress,
  calculateGoalProgress,
  getProgressStatus,
  formatProgress,
} from "./progress-utils";

/**
 * Hydrate key results with live metric values
 *
 * Value resolution precedence:
 * 1. overrideMetric: true → Use current from frontmatter
 * 2. metric defined (no override) → Fetch live value from integration
 * 3. No metric defined → Use current from frontmatter or baseline
 */
export async function hydrateKeyResults(
  keyResults: KeyResult[],
  userId?: string
): Promise<HydratedKeyResult[]> {
  // Import dynamically to avoid circular dependency
  const { calculateKeyResultProgress } = await import("./progress-utils");

  return Promise.all(
    keyResults.map(async (kr) => {
      let current: number;
      let isLive = false;
      let isOverridden = false;

      // Case 1: Override flag set - use frontmatter value
      if (kr.overrideMetric && kr.current !== undefined) {
        current = kr.current;
        isOverridden = true;
      }
      // Case 2: Metric defined - fetch from integration
      else if (kr.metric && kr.metric.source !== "manual") {
        try {
          current = await fetchMetric(kr.metric, userId);
          isLive = true;
        } catch (error) {
          console.error(`Error fetching metric for KR ${kr.id}:`, error);
          // Fall back to current or baseline
          current = kr.current ?? kr.baseline ?? 0;
        }
      }
      // Case 3: Manual or no metric - use frontmatter or baseline
      else {
        current = kr.current ?? kr.baseline ?? 0;
      }

      const progress = calculateKeyResultProgress(current, kr.target, kr.baseline ?? 0);

      return {
        ...kr,
        current,
        isLive,
        isOverridden,
        progress,
      };
    })
  );
}

/**
 * Fetch work/initiative progress from Linear
 */
async function fetchWorkProgress(initiativeIds: string[]): Promise<number> {
  if (initiativeIds.length === 0) return 0;

  try {
    // Fetch progress for each initiative from Linear
    const { fetchMetric } = await import("@/lib/sources");
    
    const progresses = await Promise.all(
      initiativeIds.map(async (initiativeId) => {
        try {
          return await fetchMetric({
            source: "linear",
            type: "initiativeProgress",
            config: { initiativeId },
          });
        } catch {
          return 0;
        }
      })
    );

    // Average progress across all initiatives
    const total = progresses.reduce((sum, p) => sum + p, 0);
    return Math.round(total / progresses.length);
  } catch {
    return 0;
  }
}

/**
 * Hydrate a goal with live metric values
 */
export async function hydrateGoal(goal: Goal, userId?: string): Promise<HydratedGoal> {
  const { calculateGoalProgress } = await import("./progress-utils");

  const keyResults = goal.frontmatter.keyResults || [];
  const initiatives = goal.frontmatter.initiatives || [];
  const hydratedKeyResults = await hydrateKeyResults(keyResults, userId);

  // Use manual progress override if set, otherwise calculate
  const progress = goal.frontmatter.progress ?? calculateGoalProgress(hydratedKeyResults);
  const hasLiveData = hydratedKeyResults.some((kr) => kr.isLive);

  // Fetch work/initiative progress
  const workProgress = await fetchWorkProgress(initiatives);

  return {
    ...goal,
    keyResults: hydratedKeyResults,
    progress,
    hasLiveData,
    workProgress,
    workItemCount: initiatives.length,
  };
}
