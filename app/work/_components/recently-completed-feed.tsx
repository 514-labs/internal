"use client";

import type { Issue } from "@/lib/analytics/linear/schemas";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface RecentlyCompletedFeedProps {
  issues: Issue[];
  isLoading?: boolean;
}

export function RecentlyCompletedFeed({
  issues,
  isLoading,
}: RecentlyCompletedFeedProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recently Completed</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-2 h-2 mt-2 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (issues.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Recently Completed</h3>
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CheckCircle className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>No recently completed issues</EmptyTitle>
            <EmptyDescription>
              Completed issues from Linear will appear here
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">Recently Completed</h3>
      <div className="space-y-3">
        {issues.map((issue) => (
          <a
            key={issue.id}
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 hover:bg-accent rounded-lg p-2 -mx-2 transition-colors"
          >
            <div
              className="w-2 h-2 mt-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: issue.state?.color || "#10b981",
              }}
            ></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  {issue.identifier}
                </span>
                <p className="text-sm font-medium flex-1 truncate">
                  {issue.title}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {issue.completedAt && (
                  <span>
                    {formatDistanceToNow(new Date(issue.completedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
                {issue.assignee && (
                  <div className="flex items-center gap-1">
                    {issue.assignee.avatarUrl && (
                      <img
                        src={issue.assignee.avatarUrl}
                        alt={issue.assignee.displayName}
                        className="w-4 h-4 rounded-full"
                      />
                    )}
                    <span>{issue.assignee.displayName}</span>
                  </div>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
