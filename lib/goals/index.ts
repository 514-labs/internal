/**
 * Goals Library (Server-only)
 *
 * This module includes server-side functions that use Node.js APIs (fs).
 * For client components, import from "@/lib/goals/client" instead.
 *
 * Usage:
 * ```ts
 * // Server components / API routes:
 * import { getGoal, getAllGoals, hydrateGoal } from "@/lib/goals";
 *
 * // Client components:
 * import { getProgressStatus, type GoalListItem } from "@/lib/goals/client";
 * ```
 */

import "server-only";

// Loader functions (server-only - uses fs)
export {
  getGoal,
  getAllGoals,
  getGoalsByDomain,
  getGoalsByTeam,
  getGoalsByOwner,
  getActiveGoals,
  getAllGoalSlugs,
} from "./loader";

// Progress calculation
export {
  calculateKeyResultProgress,
  calculateGoalProgress,
  hydrateKeyResults,
  hydrateGoal,
  getProgressStatus,
  formatProgress,
} from "./progress";

// Types
export type {
  Goal,
  GoalListItem,
  GoalFilters,
  HydratedGoal,
  HydratedKeyResult,
  StrategicDomain,
} from "./types";

