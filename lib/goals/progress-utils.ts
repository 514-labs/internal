/**
 * Client-safe progress calculation utilities
 *
 * These functions have no server dependencies and can be safely
 * imported in client components.
 */

import type { HydratedKeyResult } from "./types";

/**
 * Calculate progress for a single key result
 *
 * Formula: (current - baseline) / (target - baseline) * 100
 */
export function calculateKeyResultProgress(
  current: number,
  target: number,
  baseline: number = 0
): number {
  if (target === baseline) {
    return current >= target ? 100 : 0;
  }

  const progress = ((current - baseline) / (target - baseline)) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

/**
 * Calculate overall goal progress from key results
 *
 * If the goal has a manual progress override, use that.
 * Otherwise, average the progress of all key results.
 */
export function calculateGoalProgress(keyResults: HydratedKeyResult[]): number {
  if (keyResults.length === 0) return 0;

  const total = keyResults.reduce((sum, kr) => sum + kr.progress, 0);
  return Math.round(total / keyResults.length);
}

/**
 * Get progress status based on percentage and target completion
 */
export function getProgressStatus(
  progress: number,
  targetProgress?: number
): "on-track" | "at-risk" | "behind" | "completed" {
  if (progress >= 100) return "completed";

  // Default target progress assumes linear progress through time
  const target = targetProgress ?? 50;

  if (progress >= target) return "on-track";
  if (progress >= target * 0.7) return "at-risk";
  return "behind";
}

/**
 * Format progress for display
 */
export function formatProgress(progress: number, unit?: string): string {
  if (unit === "%") {
    return `${progress}%`;
  }
  if (unit === "$") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(progress);
  }
  return `${progress}${unit ? ` ${unit}` : ""}`;
}

