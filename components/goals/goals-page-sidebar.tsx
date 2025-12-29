"use client";

import type { GoalFilters, StrategicDomain } from "@/lib/goals/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { LayoutGrid, List, X } from "lucide-react";

interface GoalsPageSidebarProps {
  filters: GoalFilters;
  onFiltersChange: (filters: GoalFilters) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  timeframes: string[];
  teams?: { id: string; name: string }[];
}

export function GoalsPageSidebar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  timeframes,
  teams = [],
}: GoalsPageSidebarProps) {
  const hasActiveFilters = Object.values(filters).some(Boolean);

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <nav className="space-y-2">
      {/* View Mode */}
      <div>
        <div className="flex h-8 shrink-0 items-center px-2 text-xs font-medium text-sidebar-foreground/70">
          View
        </div>
        <div className="px-2">
          <ButtonGroup className="w-full" aria-label="View mode">
            <Button
              variant={viewMode === "grid" ? "secondary" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("grid")}
              className="flex-1"
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Grid
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "outline"}
              size="sm"
              onClick={() => onViewModeChange("list")}
              className="flex-1"
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
          </ButtonGroup>
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex h-8 shrink-0 items-center justify-between px-2">
          <span className="text-xs font-medium text-sidebar-foreground/70">
            Filters
          </span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-6 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        <div className="space-y-3 px-2">
          {/* Status */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Status</div>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  status:
                    value === "all"
                      ? undefined
                      : (value as GoalFilters["status"]),
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strategic Domain */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Domain</div>
            <Select
              value={filters.strategicDomain || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  strategicDomain:
                    value === "all" ? undefined : (value as StrategicDomain),
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All domains" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All domains</SelectItem>
                <SelectItem value="product-development">
                  Product Development
                </SelectItem>
                <SelectItem value="customer-development">
                  Customer Development
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Timeframe */}
          <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">Timeframe</div>
            <Select
              value={filters.timeframe || "all"}
              onValueChange={(value) =>
                onFiltersChange({
                  ...filters,
                  timeframe: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="All timeframes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All timeframes</SelectItem>
                {timeframes.map((tf) => (
                  <SelectItem key={tf} value={tf}>
                    {tf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team - only show if teams are provided */}
          {teams.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-muted-foreground">Team</div>
              <Select
                value={filters.team || "all"}
                onValueChange={(value) =>
                  onFiltersChange({
                    ...filters,
                    team: value === "all" ? undefined : value,
                  })
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
