"use client";

import { useState, useMemo } from "react";
import type { GoalListItem, GoalFilters } from "@/lib/goals/client";
import {
  GoalCardGrid,
  GoalListView,
  GoalsSummary,
  GoalsPageSidebar,
} from "@/components/goals";
import { ContentLayout } from "@/components/layouts";

interface GoalsPageContentProps {
  goals: GoalListItem[];
  timeframes: string[];
  teams?: { id: string; name: string }[];
}

export function GoalsPageContent({
  goals,
  timeframes,
  teams = [],
}: GoalsPageContentProps) {
  const [filters, setFilters] = useState<GoalFilters>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Apply filters
  const filteredGoals = useMemo(() => {
    let result = goals;

    if (filters.status) {
      result = result.filter((g) => g.frontmatter.status === filters.status);
    }

    if (filters.strategicDomain) {
      result = result.filter(
        (g) => g.frontmatter.strategicDomain === filters.strategicDomain
      );
    }

    if (filters.team) {
      result = result.filter((g) => g.frontmatter.team === filters.team);
    }

    if (filters.owner) {
      result = result.filter((g) => g.frontmatter.owner === filters.owner);
    }

    if (filters.timeframe) {
      result = result.filter(
        (g) => g.frontmatter.timeframe === filters.timeframe
      );
    }

    return result;
  }, [goals, filters]);

  // Determine if we should show domain badges based on filter
  const showDomain = !filters.strategicDomain;

  return (
    <ContentLayout
      filters={
        <GoalsPageSidebar
          filters={filters}
          onFiltersChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          timeframes={timeframes}
          teams={teams}
        />
      }
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Goals</h1>
        <p className="text-muted-foreground">
          Track progress toward organizational objectives
        </p>
      </div>

      {/* Summary */}
      <GoalsSummary goals={filteredGoals} showLink={false} className="mb-4" />

      {/* Goals display */}
      {viewMode === "grid" ? (
        <GoalCardGrid goals={filteredGoals} showDomain={showDomain} />
      ) : (
        <GoalListView goals={filteredGoals} showDomain={showDomain} />
      )}
    </ContentLayout>
  );
}
