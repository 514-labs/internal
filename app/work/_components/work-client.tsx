"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type {
  Project,
  Initiative,
  Issue,
} from "@/lib/analytics/linear/schemas";
import { ActiveProjectsCard } from "./active-projects-card";
import { ActiveInitiativesCard } from "./active-initiatives-card";
import { RecentlyCompletedFeed } from "./recently-completed-feed";
import { useBreadcrumb } from "@/components/breadcrumb-provider";

interface WorkClientProps {
  initialProjects: Project[];
  initialInitiatives: Initiative[];
  initialIssues: Issue[];
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/analytics/linear/projects?state=started");
  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ error: "Failed to fetch projects" }));
    throw new Error(data.message || data.error || "Failed to fetch projects");
  }
  const data = await res.json();
  return data.data || [];
}

async function fetchInitiatives(): Promise<Initiative[]> {
  // Fetch all initiatives (Linear uses various status names)
  const res = await fetch("/api/analytics/linear/initiatives");
  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ error: "Failed to fetch initiatives" }));
    throw new Error(
      data.message || data.error || "Failed to fetch initiatives"
    );
  }
  const data = await res.json();
  return data.data || [];
}

async function fetchCompletedIssues(): Promise<Issue[]> {
  const res = await fetch(
    "/api/analytics/linear/issues?completed=true&limit=10"
  );
  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ error: "Failed to fetch issues" }));
    throw new Error(data.message || data.error || "Failed to fetch issues");
  }
  const data = await res.json();
  return data.data || [];
}

export function WorkClient({
  initialProjects,
  initialInitiatives,
  initialIssues,
}: WorkClientProps) {
  const searchParams = useSearchParams();
  const { setItems } = useBreadcrumb();

  // Update breadcrumb based on active filters
  useEffect(() => {
    const breadcrumbItems = [];

    const projectState = searchParams.get("projectState");
    const initiativeStatus = searchParams.get("initiativeStatus");
    const dateFilter = searchParams.get("dateFilter");

    if (projectState) {
      breadcrumbItems.push({ label: `Projects: ${projectState}` });
    }

    if (initiativeStatus) {
      breadcrumbItems.push({ label: `Initiatives: ${initiativeStatus}` });
    }

    if (dateFilter) {
      const filterLabels: Record<string, string> = {
        overdue: "Overdue",
        this_month: "This month",
        this_quarter: "This quarter",
        no_date: "No target date",
      };
      breadcrumbItems.push({ label: filterLabels[dateFilter] || dateFilter });
    }

    setItems(breadcrumbItems);
  }, [searchParams, setItems]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["projects", "started"],
    queryFn: fetchProjects,
    initialData: initialProjects,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false, // Don't retry on configuration errors
    throwOnError: false, // Don't throw errors, handle them gracefully
  });

  const { data: initiatives, isLoading: initiativesLoading } = useQuery({
    queryKey: ["initiatives", "active"],
    queryFn: fetchInitiatives,
    initialData: initialInitiatives,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
    throwOnError: false,
  });

  const { data: issues, isLoading: issuesLoading } = useQuery({
    queryKey: ["issues", "completed"],
    queryFn: fetchCompletedIssues,
    initialData: initialIssues,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false,
    throwOnError: false,
  });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Initiatives section */}
      <div className="space-y-4">
        <ActiveInitiativesCard
          initiatives={initiatives || []}
          isLoading={initiativesLoading}
        />
      </div>

      {/* Projects and Recently Completed section */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActiveProjectsCard
          projects={projects || []}
          isLoading={projectsLoading}
        />
        <RecentlyCompletedFeed
          issues={issues || []}
          isLoading={issuesLoading}
        />
      </div>
    </div>
  );
}
