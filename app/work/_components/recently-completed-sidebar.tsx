"use client";

import type { Issue } from "@/lib/analytics/linear/schemas";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle } from "lucide-react";

interface RecentlyCompletedSidebarProps {
  issues: Issue[];
  isLoading?: boolean;
}

export function RecentlyCompletedSidebar({
  issues,
  isLoading,
}: RecentlyCompletedSidebarProps) {
  if (isLoading) {
    return (
      <nav className="space-y-2 p-2">
        <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
          Recently Completed
        </div>
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse px-2 py-1.5">
              <div className="h-3.5 bg-muted rounded w-full mb-1"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  if (issues.length === 0) {
    return (
      <nav className="space-y-2 p-2">
        <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
          Recently Completed
        </div>
        <div className="flex flex-col items-start justify-center py-6 px-2">
          <p className="text-xs text-muted-foreground">
            No recently completed issues
          </p>
        </div>
      </nav>
    );
  }

  return (
    <nav className="space-y-1 p-2">
      <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
        Recently Completed
      </div>
      <ul className="space-y-0.5">
        {issues.map((issue) => (
          <li key={issue.id} className="relative">
            <a
              href={issue.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <div
                className="w-1.5 h-1.5 mt-1.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: issue.state?.color || "#10b981",
                }}
              />
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground/70 group-hover:text-accent-foreground/70">
                    {issue.identifier}
                  </span>
                </div>
                <p className="text-xs leading-tight line-clamp-2">
                  {issue.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
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
                          className="w-3 h-3 rounded-full"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
