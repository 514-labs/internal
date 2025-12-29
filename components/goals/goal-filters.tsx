"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Search, Filter } from "lucide-react";
import type { GoalFilters, StrategicDomain } from "@/lib/goals/client";

interface GoalFiltersBarProps {
  filters: GoalFilters;
  onFiltersChange: (filters: GoalFilters) => void;
  teams?: { id: string; name: string }[];
  owners?: { id: string; name: string }[];
  timeframes?: string[];
  className?: string;
}

export function GoalFiltersBar({
  filters,
  onFiltersChange,
  teams = [],
  owners = [],
  timeframes = [],
  className,
}: GoalFiltersBarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const hasActiveFilters =
    filters.status ||
    filters.strategicDomain ||
    filters.team ||
    filters.owner ||
    filters.timeframe;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = (key: keyof GoalFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? undefined : value,
    });
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search goals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status || "all"}
          onValueChange={(value) => updateFilter("status", value)}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Domain filter */}
        <Select
          value={filters.strategicDomain || "all"}
          onValueChange={(value) =>
            updateFilter("strategicDomain", value as StrategicDomain)
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            <SelectItem value="company">Company</SelectItem>
            <SelectItem value="plm">PLM</SelectItem>
            <SelectItem value="slg">SLG</SelectItem>
            <SelectItem value="awareness">Awareness</SelectItem>
            <SelectItem value="platform">Platform</SelectItem>
            <SelectItem value="product-development">Product Dev</SelectItem>
            <SelectItem value="customer-development">Customer Dev</SelectItem>
          </SelectContent>
        </Select>

        {/* Team filter */}
        {teams.length > 0 && (
          <Select
            value={filters.team || "all"}
            onValueChange={(value) => updateFilter("team", value)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Timeframe filter */}
        {timeframes.length > 0 && (
          <Select
            value={filters.timeframe || "all"}
            onValueChange={(value) => updateFilter("timeframe", value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              {timeframes.map((tf) => (
                <SelectItem key={tf} value={tf}>
                  {tf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1.5"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

interface GoalFilterChipsProps {
  filters: GoalFilters;
  onFiltersChange: (filters: GoalFilters) => void;
  className?: string;
}

export function GoalFilterChips({
  filters,
  onFiltersChange,
  className,
}: GoalFilterChipsProps) {
  const removeFilter = (key: keyof GoalFilters) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
  };

  const activeFilters = Object.entries(filters).filter(([, value]) => value);

  if (activeFilters.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {activeFilters.map(([key, value]) => (
          <Button
            key={key}
            variant="secondary"
            size="sm"
            onClick={() => removeFilter(key as keyof GoalFilters)}
            className="gap-1.5 h-7"
          >
            <span className="text-muted-foreground">{key}:</span>
            {value}
            <X className="h-3 w-3" />
          </Button>
        ))}
      </div>
    </div>
  );
}

