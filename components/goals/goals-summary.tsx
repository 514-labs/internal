"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { getProgressStatus, type GoalListItem } from "@/lib/goals/client";
import { GoalProgressRing, GoalDualProgress } from "./goal-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";

interface GoalsSummaryProps {
  goals: GoalListItem[];
  title?: string;
  showLink?: boolean;
  className?: string;
}

export function GoalsSummary({
  goals,
  title = "Goals Progress",
  showLink = true,
  className,
}: GoalsSummaryProps) {
  const activeGoals = goals.filter((g) => g.frontmatter.status === "active");

  const stats = {
    total: activeGoals.length,
    completed: activeGoals.filter((g) => g.progress >= 100).length,
    onTrack: activeGoals.filter((g) => {
      const status = getProgressStatus(g.progress);
      return status === "on-track";
    }).length,
    atRisk: activeGoals.filter((g) => {
      const status = getProgressStatus(g.progress);
      return status === "at-risk" || status === "behind";
    }).length,
  };

  const overallProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length
        )
      : 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5" />
            {title}
          </CardTitle>
          {showLink && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/goals" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-6">
          <GoalProgressRing progress={overallProgress} size={80} strokeWidth={6} />
          <div className="flex-1">
            <p className="text-2xl font-bold">{overallProgress}%</p>
            <p className="text-sm text-muted-foreground">
              Overall progress ({stats.total} active goal
              {stats.total !== 1 ? "s" : ""})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold">{stats.completed}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-lg font-semibold">{stats.onTrack}</p>
              <p className="text-xs text-muted-foreground">On Track</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-lg font-semibold">{stats.atRisk}</p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface GoalsCompactListProps {
  goals: GoalListItem[];
  limit?: number;
  className?: string;
}

export function GoalsCompactList({
  goals,
  limit = 5,
  className,
}: GoalsCompactListProps) {
  const displayGoals = goals.slice(0, limit);

  return (
    <div className={cn("space-y-2", className)}>
      {displayGoals.map((goal) => (
        <Link
          key={goal.slug}
          href={`/goals/${goal.slug}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <GoalDualProgress
            keyResultsProgress={goal.progress}
            keyResultsCount={goal.keyResultCount}
            workProgress={goal.workProgress}
            workItemsCount={goal.workItemCount}
            size={32}
            strokeWidth={3}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{goal.frontmatter.title}</p>
            <p className="text-xs text-muted-foreground">{goal.frontmatter.timeframe}</p>
          </div>
        </Link>
      ))}
      {goals.length > limit && (
        <Button variant="ghost" size="sm" asChild className="w-full">
          <Link href="/goals">
            View all {goals.length} goals
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
}

