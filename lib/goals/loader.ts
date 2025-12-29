/**
 * Goal content loader (Server-only)
 *
 * Loads goals from MDX files and provides filtering capabilities.
 * This module uses Node.js fs APIs and cannot be imported in client components.
 */

import "server-only";

import { getContent, getAllContent } from "@/lib/content/loader";
import type { ContentItem, ContentListItem } from "@/lib/content/types";
import type { GoalFrontmatter } from "@/lib/content/schemas";
import type { Goal, GoalListItem, GoalFilters, StrategicDomain } from "./types";

/**
 * Get a single goal by slug
 */
export async function getGoal(slug: string): Promise<Goal | null> {
  const content = await getContent("goals", slug);

  if (!content) {
    return null;
  }

  return {
    slug: content.slug,
    filePath: content.filePath,
    frontmatter: content.frontmatter as GoalFrontmatter,
    content: content.content,
    html: content.html,
    mdxSource: content.mdxSource,
    toc: content.toc,
  };
}

/**
 * Get all goals with optional filtering
 */
export async function getAllGoals(filters?: GoalFilters): Promise<GoalListItem[]> {
  const allContent = await getAllContent("goals");

  let goals = allContent.map((item) => {
    const frontmatter = item.frontmatter as GoalFrontmatter;
    const keyResults = frontmatter.keyResults || [];
    const initiatives = frontmatter.initiatives || [];

    return {
      slug: item.slug,
      frontmatter,
      progress: frontmatter.progress ?? calculateGoalProgressFromKeyResults(keyResults),
      keyResultCount: keyResults.length,
      // Work progress is 0 by default at list level (requires hydration for live data)
      workProgress: 0,
      workItemCount: initiatives.length,
    };
  });

  // Apply filters
  if (filters?.status) {
    goals = goals.filter((g) => g.frontmatter.status === filters.status);
  }

  if (filters?.strategicDomain) {
    goals = goals.filter((g) => g.frontmatter.strategicDomain === filters.strategicDomain);
  }

  if (filters?.team) {
    goals = goals.filter((g) => g.frontmatter.team === filters.team);
  }

  if (filters?.owner) {
    goals = goals.filter((g) => g.frontmatter.owner === filters.owner);
  }

  if (filters?.timeframe) {
    goals = goals.filter((g) => g.frontmatter.timeframe === filters.timeframe);
  }

  return goals;
}

/**
 * Get goals by strategic domain
 */
export async function getGoalsByDomain(domain: StrategicDomain): Promise<GoalListItem[]> {
  return getAllGoals({ strategicDomain: domain });
}

/**
 * Get goals by team
 */
export async function getGoalsByTeam(teamId: string): Promise<GoalListItem[]> {
  return getAllGoals({ team: teamId });
}

/**
 * Get goals by owner
 */
export async function getGoalsByOwner(owner: string): Promise<GoalListItem[]> {
  return getAllGoals({ owner });
}

/**
 * Get active goals
 */
export async function getActiveGoals(): Promise<GoalListItem[]> {
  return getAllGoals({ status: "active" });
}

/**
 * Get all goal slugs for static generation
 */
export async function getAllGoalSlugs(): Promise<string[]> {
  const goals = await getAllGoals();
  return goals.map((g) => g.slug);
}

/**
 * Calculate basic progress from key results without hydration
 * (for list views where we don't need live data)
 */
function calculateGoalProgressFromKeyResults(
  keyResults: { current?: number; target: number; baseline?: number }[]
): number {
  if (keyResults.length === 0) return 0;

  const progresses = keyResults.map((kr) => {
    const current = kr.current ?? (kr.baseline ?? 0);
    const baseline = kr.baseline ?? 0;
    const target = kr.target;

    if (target === baseline) return 100;
    const progress = ((current - baseline) / (target - baseline)) * 100;
    return Math.max(0, Math.min(100, progress));
  });

  const total = progresses.reduce((sum, p) => sum + p, 0);
  return Math.round(total / progresses.length);
}

