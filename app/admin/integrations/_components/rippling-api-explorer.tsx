"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  FolderTree,
  Layers,
  MapPin,
  Briefcase,
  User,
  Settings,
  UsersRound,
  Handshake,
  Shield,
  Boxes,
  Grid3X3,
  UserCog,
  HardHat,
  Network,
  Megaphone,
  Palette,
  Database,
  BarChart3,
} from "lucide-react";

/**
 * Entity endpoint - fetches raw data/records
 */
interface EntityEndpoint {
  id: string;
  entity: string;
  description: string;
  endpoint: string;
  icon: React.ElementType;
  color: string;
}

/**
 * Derived metric - computed from entity data
 */
interface DerivedMetric {
  id: string;
  name: string;
  sourceEntity: string;
  computation: string;
}

const entities: EntityEndpoint[] = [
  // Authentication & Profile
  {
    id: "me",
    entity: "CurrentUser",
    description: "Your Rippling SSO user profile",
    endpoint: "/api/integrations/rippling/me",
    icon: User,
    color: "bg-blue-500",
  },

  // Business Partners
  {
    id: "business-partners",
    entity: "BusinessPartner",
    description: "Business partner records",
    endpoint: "/api/integrations/rippling/business-partners",
    icon: Handshake,
    color: "bg-emerald-500",
  },
  {
    id: "business-partner-groups",
    entity: "BusinessPartnerGroup",
    description: "Business partner group records",
    endpoint: "/api/integrations/rippling/business-partner-groups",
    icon: Network,
    color: "bg-emerald-600",
  },

  // Company & Organization
  {
    id: "companies",
    entity: "Company",
    description: "Company information records",
    endpoint: "/api/integrations/rippling/company",
    icon: Building2,
    color: "bg-indigo-500",
  },
  {
    id: "departments",
    entity: "Department",
    description: "Department hierarchy records",
    endpoint: "/api/integrations/rippling/departments",
    icon: FolderTree,
    color: "bg-orange-500",
  },
  {
    id: "teams",
    entity: "Team",
    description: "Team structure records",
    endpoint: "/api/integrations/rippling/teams",
    icon: UsersRound,
    color: "bg-purple-500",
  },
  {
    id: "work-locations",
    entity: "WorkLocation",
    description: "Office location records",
    endpoint: "/api/integrations/rippling/work-locations",
    icon: MapPin,
    color: "bg-teal-500",
  },

  // People & Workers
  {
    id: "users",
    entity: "User",
    description: "All user records",
    endpoint: "/api/integrations/rippling/users",
    icon: Users,
    color: "bg-green-500",
  },
  {
    id: "workers",
    entity: "Worker",
    description: "Worker records (employees, contractors)",
    endpoint: "/api/integrations/rippling/workers",
    icon: HardHat,
    color: "bg-green-600",
  },

  // Employment Configuration
  {
    id: "employment-types",
    entity: "EmploymentType",
    description: "Employment type records",
    endpoint: "/api/integrations/rippling/employment-types",
    icon: Briefcase,
    color: "bg-amber-500",
  },
  {
    id: "job-functions",
    entity: "JobFunction",
    description: "Job function records",
    endpoint: "/api/integrations/rippling/job-functions",
    icon: UserCog,
    color: "bg-amber-600",
  },
  {
    id: "entitlements",
    entity: "Entitlement",
    description: "User entitlement records",
    endpoint: "/api/integrations/rippling/entitlements",
    icon: Shield,
    color: "bg-red-500",
  },

  // Custom Fields & Objects
  {
    id: "custom-fields",
    entity: "CustomField",
    description: "Custom field definition records",
    endpoint: "/api/integrations/rippling/custom-fields",
    icon: Settings,
    color: "bg-slate-500",
  },
  {
    id: "custom-objects",
    entity: "CustomObject",
    description: "Custom object definition records",
    endpoint: "/api/integrations/rippling/custom-objects",
    icon: Boxes,
    color: "bg-slate-600",
  },
  {
    id: "object-categories",
    entity: "ObjectCategory",
    description: "Object category records",
    endpoint: "/api/integrations/rippling/object-categories",
    icon: Grid3X3,
    color: "bg-slate-700",
  },

  // Supergroups
  {
    id: "supergroups",
    entity: "Supergroup",
    description: "Dynamic group records",
    endpoint: "/api/integrations/rippling/supergroups",
    icon: Layers,
    color: "bg-pink-500",
  },
];

const derivedMetrics: DerivedMetric[] = [
  {
    id: "headcount",
    name: "headcount",
    sourceEntity: "Worker",
    computation: "Count of active workers",
  },
  {
    id: "team-size",
    name: "teamSize",
    sourceEntity: "Worker",
    computation: "Count of workers by team",
  },
  {
    id: "department-size",
    name: "departmentSize",
    sourceEntity: "Worker",
    computation: "Count of workers by department",
  },
];

// Job Board entities
const jobBoardEntities: EntityEndpoint[] = [
  {
    id: "job-board-jobs",
    entity: "Job",
    description: "Published job listing records",
    endpoint: "/api/integrations/rippling/job-board/jobs",
    icon: Briefcase,
    color: "bg-rose-500",
  },
  {
    id: "job-board-branding",
    entity: "Branding",
    description: "Board branding configuration",
    endpoint: "/api/integrations/rippling/job-board/branding",
    icon: Palette,
    color: "bg-rose-600",
  },
  {
    id: "job-board-locations",
    entity: "JobLocation",
    description: "Available job location records",
    endpoint: "/api/integrations/rippling/job-board/locations",
    icon: MapPin,
    color: "bg-rose-700",
  },
  {
    id: "job-board-departments",
    entity: "JobDepartment",
    description: "Departments with open roles",
    endpoint: "/api/integrations/rippling/job-board/departments",
    icon: FolderTree,
    color: "bg-rose-800",
  },
];

interface EntityCardProps {
  config: EntityEndpoint;
}

function EntityCard({ config }: EntityCardProps) {
  const [data, setData] = useState<Record<string, unknown> | unknown[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const Icon = config.icon;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(config.endpoint);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to fetch data");
      }

      setData(result.data);
      setExpanded(true);
    } catch (err) {
      console.error(`Error fetching ${config.entity}:`, err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDataCount = (): number | null => {
    if (!data) return null;
    if (Array.isArray(data)) return data.length;
    if (typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.data)) return obj.data.length;
      if (Array.isArray(obj.results)) return obj.results.length;
    }
    return null;
  };

  const count = getDataCount();

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${config.color} text-white`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{config.entity}</h3>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20"
              >
                ENTITY
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {count !== null && (
              <span className="px-2 py-1 bg-muted text-foreground rounded text-sm font-medium">
                {count}
              </span>
            )}
            <Button
              size="sm"
              variant={expanded ? "outline" : "default"}
              onClick={expanded ? () => setExpanded(false) : fetchData}
              disabled={loading}
            >
              {loading ? "Loading..." : expanded ? "Hide" : "Fetch"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {expanded && data && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Response Data
              </span>
              <Button size="sm" variant="ghost" onClick={fetchData} disabled={loading}>
                Refresh
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-3 max-h-80 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap break-words">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface DerivedMetricCardProps {
  metric: DerivedMetric;
}

function DerivedMetricCard({ metric }: DerivedMetricCardProps) {
  return (
    <Card className="overflow-hidden border-amber-500/20">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500 text-white">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold font-mono">{metric.name}</h3>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-600 border-amber-500/20"
              >
                DERIVED
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-blue-600">{metric.sourceEntity}</span> → {metric.computation}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function RipplingApiExplorer() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rippling API Explorer</h2>
          <p className="text-muted-foreground">
            {entities.length} entities → {derivedMetrics.length} derived metrics
          </p>
        </div>
        <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
          Connected
        </div>
      </div>

      {/* Entity Endpoints - Primary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Database className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Entities</h3>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            Raw Data
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Fetch structured records. All metrics are derived from these entities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entities.map((entity) => (
            <EntityCard key={entity.id} config={entity} />
          ))}
        </div>
      </section>

      {/* Derived Metrics - Secondary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Derived Metrics</h3>
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            Computed from Entities
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Metrics computed by aggregating entity data. Used for key result tracking in goals.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {derivedMetrics.map((metric) => (
            <DerivedMetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </section>

      {/* Job Board Entities - Public API */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-semibold">Job Board Entities</h3>
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
            Public API
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Job board configured via RIPPLING_JOB_BOARD_SLUG environment variable. No authentication required.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobBoardEntities.map((entity) => (
            <EntityCard key={entity.id} config={entity} />
          ))}
        </div>
      </section>
    </div>
  );
}
