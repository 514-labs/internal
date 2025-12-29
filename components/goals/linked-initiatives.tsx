"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink, GitBranch, Plus } from "lucide-react";
import type { LinearInitiative } from "@/lib/sources/types";

interface LinkedInitiativesProps {
  initiativeIds?: string[];
  showEmptyState?: boolean;
  className?: string;
}

export function LinkedInitiatives({
  initiativeIds = [],
  showEmptyState = false,
  className,
}: LinkedInitiativesProps) {
  const [initiatives, setInitiatives] = useState<LinearInitiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInitiatives() {
      if (initiativeIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/linear/initiatives", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: initiativeIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch initiatives");
        }

        const data = await response.json();
        setInitiatives(data.initiatives || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchInitiatives();
  }, [initiativeIds]);

  // Show empty state when requested and no initiatives
  if (initiativeIds.length === 0 && showEmptyState) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-dashed rounded-lg p-6 text-center">
            <div className="flex justify-center mb-3">
              <div className="p-3 rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
            </div>
            <h4 className="font-medium mb-1">No projects linked</h4>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Link Linear initiatives to track work progress against this goal.
            </p>
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md p-3 font-mono">
              <p className="mb-1">Add to the goal frontmatter:</p>
              <code className="text-primary">initiatives: ["initiative-id"]</code>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Hide completely when no initiatives and not showing empty state
  if (initiativeIds.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load initiatives from Linear
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Work
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {initiatives.map((initiative) => (
          <InitiativeItem key={initiative.id} initiative={initiative} />
        ))}
        {initiatives.length === 0 && initiativeIds.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {initiativeIds.length} initiative{initiativeIds.length !== 1 ? "s" : ""}{" "}
            referenced but not found in Linear
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface InitiativeItemProps {
  initiative: LinearInitiative;
}

function InitiativeItem({ initiative }: InitiativeItemProps) {
  const statusColors: Record<string, string> = {
    planned: "bg-muted text-muted-foreground",
    started: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{initiative.name}</h4>
          <Badge
            variant="outline"
            className={statusColors[initiative.status] || statusColors.planned}
          >
            {initiative.status}
          </Badge>
        </div>
        {initiative.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {initiative.description}
          </p>
        )}
        {initiative.projects.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            {initiative.projects.length} project
            {initiative.projects.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <a
        href={`https://linear.app/initiative/${initiative.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

