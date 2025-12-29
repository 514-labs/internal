"use client";

import Link from "next/link";
import type { GoalListItem, StrategicDomain } from "@/lib/goals/client";
import { GoalCard } from "./goal-card";
import { GoalProgressRing } from "./goal-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, ArrowRight } from "lucide-react";

interface StrategyGoalsProps {
  goals: GoalListItem[];
  domain: StrategicDomain;
  title?: string;
  showViewAll?: boolean;
  limit?: number;
}

export function StrategyGoals({
  goals,
  domain,
  title,
  showViewAll = true,
  limit = 3,
}: StrategyGoalsProps) {
  const domainGoals = goals.filter(
    (g) =>
      g.frontmatter.strategicDomain === domain &&
      g.frontmatter.status === "active"
  );

  if (domainGoals.length === 0) {
    return null;
  }

  const displayGoals = limit ? domainGoals.slice(0, limit) : domainGoals;
  const hasMore = domainGoals.length > displayGoals.length;

  const domainLabels: Record<StrategicDomain, string> = {
    "product-development": "Product Development Goals",
    "customer-development": "Customer Development Goals",
  };

  const overallProgress =
    domainGoals.length > 0
      ? Math.round(
          domainGoals.reduce((sum, g) => sum + g.progress, 0) / domainGoals.length
        )
      : 0;

  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {title || domainLabels[domain]}
            </CardTitle>
            <div className="flex items-center gap-2">
              <GoalProgressRing progress={overallProgress} size={36} strokeWidth={3} />
              <div className="text-sm text-muted-foreground">
                {domainGoals.length} goal{domainGoals.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          {showViewAll && (
            <Button variant="ghost" size="sm" asChild>
              <Link
                href={`/goals?domain=${domain}`}
                className="gap-1"
              >
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayGoals.map((goal) => (
            <GoalCard key={goal.slug} goal={goal} showDomain={false} compact />
          ))}
        </div>
        {hasMore && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/goals?domain=${domain}`}>
                View all {domainGoals.length} goals
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

