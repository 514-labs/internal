"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

interface EndpointConfig {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  icon: React.ElementType;
  color: string;
}

const endpoints: EndpointConfig[] = [
  // Authentication & Profile
  {
    id: "me",
    title: "My Profile",
    description: "Your Rippling SSO user profile",
    endpoint: "/api/integrations/rippling/me",
    icon: User,
    color: "bg-blue-500",
  },

  // Business Partners
  {
    id: "business-partners",
    title: "Business Partners",
    description: "List of business partners",
    endpoint: "/api/integrations/rippling/business-partners",
    icon: Handshake,
    color: "bg-emerald-500",
  },
  {
    id: "business-partner-groups",
    title: "Business Partner Groups",
    description: "Business partner group configurations",
    endpoint: "/api/integrations/rippling/business-partner-groups",
    icon: Network,
    color: "bg-emerald-600",
  },

  // Company & Organization
  {
    id: "companies",
    title: "Companies",
    description: "Company information and settings",
    endpoint: "/api/integrations/rippling/company",
    icon: Building2,
    color: "bg-indigo-500",
  },
  {
    id: "departments",
    title: "Departments",
    description: "Department hierarchy and information",
    endpoint: "/api/integrations/rippling/departments",
    icon: FolderTree,
    color: "bg-orange-500",
  },
  {
    id: "teams",
    title: "Teams",
    description: "Team structures and memberships",
    endpoint: "/api/integrations/rippling/teams",
    icon: UsersRound,
    color: "bg-purple-500",
  },
  {
    id: "work-locations",
    title: "Work Locations",
    description: "Office locations and remote work settings",
    endpoint: "/api/integrations/rippling/work-locations",
    icon: MapPin,
    color: "bg-teal-500",
  },

  // People & Workers
  {
    id: "users",
    title: "Users",
    description: "All users in the system",
    endpoint: "/api/integrations/rippling/users",
    icon: Users,
    color: "bg-green-500",
  },
  {
    id: "workers",
    title: "Workers",
    description: "All workers (employees, contractors, etc.)",
    endpoint: "/api/integrations/rippling/workers",
    icon: HardHat,
    color: "bg-green-600",
  },

  // Employment Configuration
  {
    id: "employment-types",
    title: "Employment Types",
    description: "Full-time, part-time, contractor types",
    endpoint: "/api/integrations/rippling/employment-types",
    icon: Briefcase,
    color: "bg-amber-500",
  },
  {
    id: "job-functions",
    title: "Job Functions",
    description: "Job function definitions",
    endpoint: "/api/integrations/rippling/job-functions",
    icon: UserCog,
    color: "bg-amber-600",
  },
  {
    id: "entitlements",
    title: "Entitlements",
    description: "User entitlements and permissions",
    endpoint: "/api/integrations/rippling/entitlements",
    icon: Shield,
    color: "bg-red-500",
  },

  // Custom Fields & Objects
  {
    id: "custom-fields",
    title: "Custom Fields",
    description: "Custom employee fields and metadata",
    endpoint: "/api/integrations/rippling/custom-fields",
    icon: Settings,
    color: "bg-slate-500",
  },
  {
    id: "custom-objects",
    title: "Custom Objects",
    description: "Custom object definitions",
    endpoint: "/api/integrations/rippling/custom-objects",
    icon: Boxes,
    color: "bg-slate-600",
  },
  {
    id: "object-categories",
    title: "Object Categories",
    description: "Categories for organizing objects",
    endpoint: "/api/integrations/rippling/object-categories",
    icon: Grid3X3,
    color: "bg-slate-700",
  },

  // Supergroups
  {
    id: "supergroups",
    title: "Supergroups",
    description: "Dynamic groups and memberships",
    endpoint: "/api/integrations/rippling/supergroups",
    icon: Layers,
    color: "bg-pink-500",
  },
];

interface EndpointCardProps {
  config: EndpointConfig;
}

function EndpointCard({ config }: EndpointCardProps) {
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
      console.error(`Error fetching ${config.title}:`, err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getDataCount = (): number | null => {
    if (!data) return null;
    if (Array.isArray(data)) return data.length;
    if (typeof data === "object") {
      if (Array.isArray(data.data)) return data.data.length;
      if (Array.isArray(data.results)) return data.results.length;
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
            <h3 className="font-semibold text-gray-900">{config.title}</h3>
            <p className="text-sm text-gray-500 truncate">{config.description}</p>
          </div>
          <div className="flex items-center gap-2">
            {count !== null && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
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
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {expanded && data && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Response Data
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchData}
                disabled={loading}
              >
                Refresh
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 max-h-80 overflow-auto">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

export function RipplingApiExplorer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rippling API Explorer</h2>
          <p className="text-gray-500">
            Test and explore all available Rippling API endpoints ({endpoints.length} endpoints)
          </p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
          Connected
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {endpoints.map((endpoint) => (
          <EndpointCard key={endpoint.id} config={endpoint} />
        ))}
      </div>
    </div>
  );
}
