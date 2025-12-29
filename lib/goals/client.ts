/**
 * Client-safe goals utilities
 *
 * This module contains functions and types that can be safely imported
 * in client components (no Node.js dependencies like fs).
 */

// Progress calculation (no server dependencies)
export {
  calculateKeyResultProgress,
  calculateGoalProgress,
  getProgressStatus,
  formatProgress,
} from "./progress-utils";

// Types (always safe)
export type {
  Goal,
  GoalListItem,
  GoalFilters,
  HydratedGoal,
  HydratedKeyResult,
  StrategicDomain,
} from "./types";
