"use client";

import type { Project } from "@/lib/analytics/linear/schemas";
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
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";

interface ActiveProjectsCardProps {
  projects: Project[];
  isLoading?: boolean;
}

export function ActiveProjectsCard({
  projects,
  isLoading,
}: ActiveProjectsCardProps) {
  const [selectedState, setSelectedState] = useState<string | null>("started");
  const [open, setOpen] = useState(false);

  // Get unique states from projects
  const states = useMemo(() => {
    const stateSet = new Set<string>();
    projects.forEach((project) => {
      if (project.state) stateSet.add(project.state);
    });
    return Array.from(stateSet).sort();
  }, [projects]);

  // Filter projects by selected state
  const filteredProjects = useMemo(() => {
    if (!selectedState) return projects;
    return projects.filter((project) => project.state === selectedState);
  }, [projects, selectedState]);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Projects</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Projects</h3>

          {/* Filter command button */}
          {states.length > 0 && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                  <span className="capitalize">
                    {selectedState || "All states"}
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="end">
                <Command>
                  <CommandInput placeholder="Filter state..." />
                  <CommandList>
                    <CommandEmpty>No states found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setSelectedState(null);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedState === null ? "opacity-100" : "opacity-0"
                          )}
                        />
                        All states ({projects.length})
                      </CommandItem>
                      {states.map((state) => (
                        <CommandItem
                          key={state}
                          onSelect={() => {
                            setSelectedState(state);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedState === state
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <span className="capitalize">{state}</span>
                          <span className="ml-auto text-muted-foreground">
                            {projects.filter((p) => p.state === state).length}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          No {selectedState || "projects"} found
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Projects</h3>

        {/* Filter command button */}
        {states.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                {selectedState ? (
                  <span className="capitalize">{selectedState}</span>
                ) : (
                  "All states"
                )}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Filter state..." />
                <CommandList>
                  <CommandEmpty>No states found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedState(null);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedState === null ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All states ({projects.length})
                    </CommandItem>
                    {states.map((state) => (
                      <CommandItem
                        key={state}
                        onSelect={() => {
                          setSelectedState(state);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedState === state
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <span className="capitalize">{state}</span>
                        <span className="ml-auto text-muted-foreground">
                          {projects.filter((p) => p.state === state).length}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="space-y-3">
        {filteredProjects.map((project) => (
          <a
            key={project.id}
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:bg-accent rounded-lg p-3 -mx-3 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {project.icon && <span>{project.icon}</span>}
                  <p className="text-sm font-medium truncate">{project.name}</p>
                </div>
                {project.targetDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Target:{" "}
                    {formatDistanceToNow(new Date(project.targetDate), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
              {project.progress !== undefined && (
                <div className="ml-4 flex items-center gap-2">
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${project.progress * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-muted-foreground min-w-[3ch]">
                    {Math.round(project.progress * 100)}%
                  </span>
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
