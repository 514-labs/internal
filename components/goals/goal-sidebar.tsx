"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ExternalLink,
  GitBranch,
  Calendar,
  Users,
  User,
  Target,
} from "lucide-react";
import type { LinearInitiative } from "@/lib/sources/types";
import type { TocEntry } from "@/lib/content/types";

interface GoalSidebarProps {
  initiativeIds?: string[];
  toc: TocEntry[];
  metadata?: {
    team?: string;
    owner?: string;
    timeframe?: string;
    status?: string;
  };
}

export function GoalSidebar({ initiativeIds, toc, metadata }: GoalSidebarProps) {
  const [initiatives, setInitiatives] = useState<LinearInitiative[]>([]);
  const [loading, setLoading] = useState(!!initiativeIds?.length);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInitiatives() {
      if (!initiativeIds || initiativeIds.length === 0) {
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

  const hasInitiatives = initiativeIds && initiativeIds.length > 0;
  const hasToc = toc.length > 0;
  const hasMetadata = metadata && (metadata.team || metadata.owner || metadata.timeframe);

  return (
    <nav className="space-y-2 p-2">
      {/* Metadata Section */}
      {hasMetadata && (
        <div>
          <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
            Details
          </div>
          <div className="space-y-2 px-2 text-sm">
            {metadata?.timeframe && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{metadata.timeframe}</span>
              </div>
            )}
            {metadata?.team && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="capitalize">{metadata.team}</span>
              </div>
            )}
            {metadata?.owner && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                <span className="capitalize">{metadata.owner}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Linked Initiatives Section */}
      {hasInitiatives && (
        <div>
          <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
            <GitBranch className="h-3.5 w-3.5 mr-1.5" />
            Linked Initiatives
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="px-2 text-xs text-muted-foreground">
              Unable to load from Linear
            </p>
          )}

          {!loading && !error && (
            <ul className="space-y-1">
              {initiatives.map((initiative) => (
                <InitiativeItem key={initiative.id} initiative={initiative} />
              ))}
              {initiatives.length === 0 && initiativeIds && initiativeIds.length > 0 && (
                <li className="px-2 text-xs text-muted-foreground">
                  {initiativeIds.length} initiative{initiativeIds.length !== 1 ? "s" : ""} not found
                </li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* On this page - TOC Section */}
      {hasToc && (
        <div>
          <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
            On this page
          </div>
          <ul className="space-y-0.5">
            {toc.map((entry) => (
              <li key={entry.id} className="relative">
                <a
                  href={`#${entry.id}`}
                  className={cn(
                    "flex w-full items-center rounded-md px-2 py-1.5 text-sm text-muted-foreground",
                    "hover:bg-accent hover:text-accent-foreground transition-colors"
                  )}
                  style={{ paddingLeft: `${8 + (entry.level - 2) * 12}px` }}
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

interface InitiativeItemProps {
  initiative: LinearInitiative;
}

function InitiativeItem({ initiative }: InitiativeItemProps) {
  const statusColors: Record<string, string> = {
    planned: "bg-muted text-muted-foreground",
    started: "bg-blue-500/10 text-blue-600",
    completed: "bg-emerald-500/10 text-emerald-600",
    cancelled: "bg-red-500/10 text-red-600",
  };

  return (
    <li className="relative">
      <a
        href={`https://linear.app/initiative/${initiative.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground",
          "hover:bg-accent hover:text-accent-foreground transition-colors group"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate">{initiative.name}</span>
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1 py-0 h-4", statusColors[initiative.status] || statusColors.planned)}
            >
              {initiative.status}
            </Badge>
            {initiative.projects.length > 0 && (
              <span className="text-xs text-muted-foreground/70">
                {initiative.projects.length} project{initiative.projects.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </a>
    </li>
  );
}

