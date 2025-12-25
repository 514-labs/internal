"use client";

import type { Initiative } from "@/lib/analytics/linear/schemas";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronDown,
  FolderKanban,
  Calendar,
  Target,
  Rocket,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Building2,
  Code,
  Palette,
  Shield,
  Globe,
  Database,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useUrlState } from "@/hooks/use-url-state";

interface ActiveInitiativesCardProps {
  initiatives: Initiative[];
  isLoading?: boolean;
}

export function ActiveInitiativesCard({
  initiatives,
  isLoading,
}: ActiveInitiativesCardProps) {
  const [selectedStatus, setSelectedStatus] = useUrlState<string | null>(
    "initiativeStatus",
    "active"
  );
  const [selectedDateFilter, setSelectedDateFilter] = useUrlState<
    string | null
  >("dateFilter", null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Get unique statuses from initiatives (normalized to lowercase)
  const statuses = useMemo(() => {
    const statusSet = new Set<string>();
    initiatives.forEach((initiative) => {
      if (initiative.status) statusSet.add(initiative.status.toLowerCase());
    });
    return Array.from(statusSet).sort();
  }, [initiatives]);

  // Date filter options
  const dateFilters = [
    { label: "All dates", value: null },
    { label: "Overdue", value: "overdue" },
    { label: "This month", value: "this_month" },
    { label: "This quarter", value: "this_quarter" },
    { label: "No target date", value: "no_date" },
  ];

  // Filter initiatives by selected status and date
  const filteredInitiatives = useMemo(() => {
    let filtered = initiatives;

    // Filter by status (case-insensitive)
    if (selectedStatus) {
      filtered = filtered.filter(
        (initiative) =>
          initiative.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    }

    // Filter by target date
    if (selectedDateFilter) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfQuarter = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3,
        1
      );
      const endOfQuarter = new Date(
        now.getFullYear(),
        Math.floor(now.getMonth() / 3) * 3 + 3,
        0
      );

      filtered = filtered.filter((initiative) => {
        if (selectedDateFilter === "overdue") {
          return initiative.targetDate && new Date(initiative.targetDate) < now;
        }
        if (selectedDateFilter === "this_month") {
          return (
            initiative.targetDate &&
            new Date(initiative.targetDate) >= startOfMonth &&
            new Date(initiative.targetDate) <= endOfMonth
          );
        }
        if (selectedDateFilter === "this_quarter") {
          return (
            initiative.targetDate &&
            new Date(initiative.targetDate) >= startOfQuarter &&
            new Date(initiative.targetDate) <= endOfQuarter
          );
        }
        if (selectedDateFilter === "no_date") {
          return !initiative.targetDate;
        }
        return true;
      });
    }

    return filtered;
  }, [initiatives, selectedStatus, selectedDateFilter]);

  // Map Linear icon names to Lucide icons
  const getIconComponent = (iconName?: string): LucideIcon => {
    if (!iconName) return Target; // Default icon

    // Normalize icon name (lowercase, no special chars)
    const normalized = iconName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Map Linear icon names and emoji to Lucide icons
    const iconMap: Record<string, LucideIcon> = {
      // Linear icon names
      moneystack: TrendingUp,
      target: Target,
      rocket: Rocket,
      sparkles: Sparkles,
      zap: Zap,
      trending: TrendingUp,
      chart: TrendingUp,
      users: Users,
      team: Users,
      people: Users,
      building: Building2,
      office: Building2,
      company: Building2,
      code: Code,
      dev: Code,
      development: Code,
      palette: Palette,
      design: Palette,
      shield: Shield,
      security: Shield,
      globe: Globe,
      world: Globe,
      database: Database,
      data: Database,
      cpu: Cpu,
      tech: Cpu,
      gear: Cpu,
      settings: Cpu,
      mobile: Cpu,
      phone: Cpu,
      lightbulb: Sparkles,
      idea: Sparkles,
      star: Sparkles,
      fire: Zap,
      folder: FolderKanban,
      project: FolderKanban,
      calendar: Calendar,

      // Emoji fallbacks
      "🎯": Target,
      "🚀": Rocket,
      "✨": Sparkles,
      "⚡": Zap,
      "📈": TrendingUp,
      "👥": Users,
      "🏢": Building2,
      "💻": Code,
      "🎨": Palette,
      "🛡️": Shield,
      "🌍": Globe,
      "🗄️": Database,
      "⚙️": Cpu,
      "📱": Cpu,
      "🔧": Cpu,
      "💡": Sparkles,
      "🌟": Sparkles,
      "🔥": Zap,
      "📊": TrendingUp,
      "💰": TrendingUp,
    };

    return iconMap[normalized] || iconMap[iconName] || Target;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active:
        "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
      planned: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
      completed:
        "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300",
      canceled: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    };
    return (
      colors[status.toLowerCase()] ||
      "bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300"
    );
  };

  // Render filter header (always visible)
  const renderFilters = () => (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <h2 className="text-2xl font-bold tracking-tight">Initiatives</h2>

      {/* Filter buttons */}
      <div className="flex items-center gap-2">
        {/* Status filter */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <span className="capitalize">
                {selectedStatus || "All statuses"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <Command>
              <CommandInput placeholder="Filter status..." />
              <CommandList>
                <CommandEmpty>No statuses found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedStatus(null);
                      setStatusOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedStatus === null ? "opacity-100" : "opacity-0"
                      )}
                    />
                    All statuses ({initiatives.length})
                  </CommandItem>
                  {/* Show Linear's standard statuses if none detected */}
                  {(statuses.length > 0
                    ? statuses
                    : ["active", "planned", "completed", "canceled"]
                  ).map((status) => (
                    <CommandItem
                      key={status}
                      onSelect={() => {
                        setSelectedStatus(status);
                        setStatusOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedStatus === status
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="capitalize">{status}</span>
                      <span className="ml-auto text-muted-foreground">
                        {
                          initiatives.filter(
                            (i) =>
                              i.status?.toLowerCase() === status.toLowerCase()
                          ).length
                        }
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Date filter */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {dateFilters.find((f) => f.value === selectedDateFilter)
                  ?.label || "All dates"}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <Command>
              <CommandList>
                <CommandGroup>
                  {dateFilters.map((filter) => (
                    <CommandItem
                      key={filter.value || "all"}
                      onSelect={() => {
                        setSelectedDateFilter(filter.value);
                        setDateOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedDateFilter === filter.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {filter.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {renderFilters()}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 animate-pulse"
            >
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (initiatives.length === 0) {
    return (
      <div className="space-y-4">
        {renderFilters()}
        <div className="rounded-lg border border-dashed bg-card text-card-foreground p-12 text-center">
          <p className="text-sm text-muted-foreground">No initiatives found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderFilters()}

      {filteredInitiatives.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card text-card-foreground p-12 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No initiatives found matching the selected filters
          </p>
          {(selectedStatus || selectedDateFilter) && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedStatus(null);
                setSelectedDateFilter(null);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInitiatives.map((initiative) => {
            const IconComponent = getIconComponent(initiative.icon);

            return (
              <a
                key={initiative.id}
                href={initiative.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                {/* Icon above title */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                  {initiative.status && (
                    <span
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
                        getStatusColor(initiative.status)
                      )}
                    >
                      {initiative.status}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base mb-2">
                  {initiative.name}
                </h3>

                {/* Description */}
                {initiative.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {initiative.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {initiative.projects && initiative.projects.length > 0 && (
                    <div className="flex items-center gap-1">
                      <FolderKanban className="h-3.5 w-3.5" />
                      <span>
                        {initiative.projects.length} project
                        {initiative.projects.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                  {initiative.targetDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {formatDistanceToNow(new Date(initiative.targetDate), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
