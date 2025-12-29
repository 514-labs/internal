"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GoalListItem } from "@/lib/goals/client";
import { GoalDualProgress } from "./goal-progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, ArrowRight } from "lucide-react";

interface GoalCardProps {
  goal: GoalListItem;
  showDomain?: boolean;
  compact?: boolean;
  className?: string;
}

export function GoalCard({
  goal,
  showDomain = true,
  compact = false,
  className,
}: GoalCardProps) {
  const {
    slug,
    frontmatter,
    progress,
    keyResultCount,
    workProgress,
    workItemCount,
  } = goal;

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    archived: "bg-muted text-muted-foreground",
  };

  const domainLabels = {
    "product-development": "Product",
    "customer-development": "Customer",
  };

  const domainColors = {
    "product-development":
      "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "customer-development": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  };

  if (compact) {
    return (
      <Link href={`/goals/${slug}`}>
        <Card
          className={cn(
            "group hover:shadow-md transition-all duration-200 cursor-pointer",
            className
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <GoalDualProgress
                keyResultsProgress={progress}
                keyResultsCount={keyResultCount}
                workProgress={workProgress}
                workItemsCount={workItemCount}
                size={40}
                strokeWidth={3}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                  {frontmatter.title}
                </h4>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/goals/${slug}`}>
      <Card
        className={cn(
          "group hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col",
          className
        )}
      >
        <CardHeader className="pb-3">
          {/* Badges row - fixed height */}
          <div className="flex items-center gap-2 mb-2 h-6">
            <Badge
              variant="outline"
              className={statusColors[frontmatter.status]}
            >
              {frontmatter.status}
            </Badge>
            {showDomain && (
              <Badge
                variant="outline"
                className={domainColors[frontmatter.strategicDomain]}
              >
                {domainLabels[frontmatter.strategicDomain]}
              </Badge>
            )}
          </div>
          {/* Title - fixed height for 2 lines */}
          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
            {frontmatter.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col flex-1">
          {/* Description - fixed height for 2 lines */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mb-4">
            {frontmatter.description || " "}
          </p>

          {/* Dual progress charts - KRs and Work */}
          <GoalDualProgress
            keyResultsProgress={progress}
            keyResultsCount={keyResultCount}
            workProgress={workProgress}
            workItemsCount={workItemCount}
            size={52}
            strokeWidth={5}
            className="mb-4"
          />

          {/* Metadata pushed to bottom */}
          <div className="space-y-1.5 text-sm text-muted-foreground mt-auto">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{frontmatter.timeframe}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="capitalize">{frontmatter.team}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface GoalCardGridProps {
  goals: GoalListItem[];
  showDomain?: boolean;
  className?: string;
}

export function GoalCardGrid({
  goals,
  showDomain,
  className,
}: GoalCardGridProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No goals found
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {goals.map((goal) => (
        <GoalCard key={goal.slug} goal={goal} showDomain={showDomain} />
      ))}
    </div>
  );
}

interface GoalListRowProps {
  goal: GoalListItem;
  showDomain?: boolean;
}

function GoalListRow({ goal, showDomain = true }: GoalListRowProps) {
  const {
    slug,
    frontmatter,
    progress,
    keyResultCount,
    workProgress,
    workItemCount,
  } = goal;

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    archived: "bg-muted text-muted-foreground",
  };

  const domainLabels = {
    "product-development": "Product",
    "customer-development": "Customer",
  };

  const domainColors = {
    "product-development":
      "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "customer-development": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  };

  return (
    <Link href={`/goals/${slug}`}>
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <GoalDualProgress
              keyResultsProgress={progress}
              keyResultsCount={keyResultCount}
              workProgress={workProgress}
              workItemsCount={workItemCount}
              size={44}
              strokeWidth={4}
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-medium group-hover:text-primary transition-colors">
                  {frontmatter.title}
                </h4>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusColors[frontmatter.status])}
                >
                  {frontmatter.status}
                </Badge>
                {showDomain && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      domainColors[frontmatter.strategicDomain]
                    )}
                  >
                    {domainLabels[frontmatter.strategicDomain]}
                  </Badge>
                )}
              </div>
              {frontmatter.description && (
                <p className="text-sm text-muted-foreground truncate">
                  {frontmatter.description}
                </p>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground shrink-0">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>{frontmatter.timeframe}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                <span className="capitalize">{frontmatter.team}</span>
              </div>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface GoalListViewProps {
  goals: GoalListItem[];
  showDomain?: boolean;
  className?: string;
}

export function GoalListView({
  goals,
  showDomain,
  className,
}: GoalListViewProps) {
  if (goals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No goals found
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {goals.map((goal) => (
        <GoalListRow key={goal.slug} goal={goal} showDomain={showDomain} />
      ))}
    </div>
  );
}
