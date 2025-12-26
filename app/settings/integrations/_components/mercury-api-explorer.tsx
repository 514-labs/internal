"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Landmark,
  ArrowLeftRight,
  Users,
  Building2,
  CreditCard,
  Wallet,
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
  // Accounts
  {
    id: "accounts",
    title: "Accounts",
    description: "List all bank accounts",
    endpoint: "/api/integrations/mercury/accounts",
    icon: Landmark,
    color: "bg-blue-500",
  },

  // Transactions
  {
    id: "transactions",
    title: "Transactions",
    description: "List all transactions across accounts",
    endpoint: "/api/integrations/mercury/transactions",
    icon: ArrowLeftRight,
    color: "bg-green-500",
  },

  // Recipients
  {
    id: "recipients",
    title: "Recipients",
    description: "Payment recipients and vendors",
    endpoint: "/api/integrations/mercury/recipients",
    icon: Users,
    color: "bg-purple-500",
  },

  // Organization
  {
    id: "organization",
    title: "Organization",
    description: "Organization info, EIN, and DBAs",
    endpoint: "/api/integrations/mercury/organization",
    icon: Building2,
    color: "bg-indigo-500",
  },

  // Users
  {
    id: "users",
    title: "Users",
    description: "Mercury account users",
    endpoint: "/api/integrations/mercury/users",
    icon: CreditCard,
    color: "bg-amber-500",
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
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.accounts)) return obj.accounts.length;
      if (Array.isArray(obj.transactions)) return obj.transactions.length;
      if (Array.isArray(obj.recipients)) return obj.recipients.length;
      if (Array.isArray(obj.users)) return obj.users.length;
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

export function MercuryApiExplorer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mercury API Explorer</h2>
          <p className="text-gray-500">
            Test and explore all available Mercury API endpoints ({endpoints.length} endpoints)
          </p>
        </div>
        <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2">
          <Wallet className="h-4 w-4" />
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

