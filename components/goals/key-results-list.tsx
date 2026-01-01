"use client";

import { cn } from "@/lib/utils";
import { formatProgress, type HydratedKeyResult } from "@/lib/goals/client";
import { GoalProgress } from "./goal-progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Edit3, Target } from "lucide-react";

interface KeyResultsListProps {
  keyResults: HydratedKeyResult[];
  compact?: boolean;
  className?: string;
}

export function KeyResultsList({
  keyResults,
  compact = false,
  className,
}: KeyResultsListProps) {
  if (keyResults.length === 0) {
    return (
      <div className={cn("text-muted-foreground text-sm", className)}>
        No key results defined
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {keyResults.map((kr) => (
        <KeyResultItem key={kr.id} keyResult={kr} compact={compact} />
      ))}
    </div>
  );
}

interface KeyResultItemProps {
  keyResult: HydratedKeyResult;
  compact?: boolean;
}

function KeyResultItem({ keyResult, compact }: KeyResultItemProps) {
  const { title, current, target, baseline, unit, progress, isLive, isOverridden } =
    keyResult;

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-4",
        compact && "p-3"
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <h4 className={cn("font-medium truncate", compact && "text-sm")}>
              {title}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isLive && (
            <Badge
              variant="outline"
              className="gap-1 text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            >
              <Activity className="h-3 w-3" />
              Live
            </Badge>
          )}
          {isOverridden && (
            <Badge
              variant="outline"
              className="gap-1 text-xs bg-amber-500/10 text-amber-600 border-amber-500/20"
            >
              <Edit3 className="h-3 w-3" />
              Override
            </Badge>
          )}
        </div>
      </div>

      <GoalProgress progress={progress} size={compact ? "sm" : "md"} />

      {!compact && (
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <span>
            {formatProgress(baseline ?? 0, unit)} → {formatProgress(target, unit)}
          </span>
          <span className="font-medium text-foreground">
            Current: {formatProgress(current, unit)}
          </span>
        </div>
      )}
    </div>
  );
}

interface KeyResultsSummaryProps {
  keyResults: HydratedKeyResult[];
  className?: string;
}

export function KeyResultsSummary({ keyResults, className }: KeyResultsSummaryProps) {
  if (keyResults.length === 0) return null;

  const completed = keyResults.filter((kr) => kr.progress >= 100).length;
  const onTrack = keyResults.filter(
    (kr) => kr.progress >= 50 && kr.progress < 100
  ).length;
  const atRisk = keyResults.filter((kr) => kr.progress < 50).length;

  return (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>{completed} completed</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span>{onTrack} on track</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <span>{atRisk} at risk</span>
      </div>
    </div>
  );
}

