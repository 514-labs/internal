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
  PiggyBank,
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

  // Treasury
  {
    id: "treasury",
    title: "Treasury",
    description: "Treasury accounts and investments",
    endpoint: "/api/integrations/mercury/treasury",
    icon: PiggyBank,
    color: "bg-emerald-500",
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

  const parseErrorMessage = (result: Record<string, unknown>, status: number): string => {
    // Handle nested error structures from Mercury API
    const errors = result.errors as Record<string, unknown> | undefined;
    const nestedMessage = errors?.message as string | undefined;
    const directMessage = result.message as string | undefined;
    const directError = result.error as string | undefined;

    // Map common errors to user-friendly messages
    if (status === 401) {
      return "Your API token is invalid or expired. Please reconnect Mercury.";
    }
    if (status === 403) {
      return "Your Mercury account doesn't have access to this feature. Check your API token permissions.";
    }
    if (status === 404) {
      return "This resource was not found in your Mercury account.";
    }
    if (status === 429) {
      return "Too many requests. Please wait a moment and try again.";
    }

    // Return the most specific message available
    return nestedMessage || directMessage || directError || `Request failed (${status})`;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(config.endpoint);
      const result = await response.json();

      if (!response.ok) {
        const errorMessage = parseErrorMessage(result, response.status);
        setError(errorMessage);
        return;
      }

      setData(result.data);
      setExpanded(true);
    } catch (err) {
      // Network errors or JSON parse errors
      const error = err as Error;
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        setError("Network error. Please check your connection.");
      } else {
        setError(error.message || "An unexpected error occurred");
      }
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
      if (Array.isArray(obj.treasuryAccounts)) return obj.treasuryAccounts.length;
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
            <h3 className="font-semibold">{config.title}</h3>
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
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Unable to fetch data</p>
            <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">{error}</p>
          </div>
        )}

        {expanded && data && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
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

export function MercuryApiExplorer() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mercury API Explorer</h2>
          <p className="text-muted-foreground">
            Test and explore all available Mercury API endpoints ({endpoints.length} endpoints)
          </p>
        </div>
        <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-2">
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

