"use client";

import { useQuery } from "@tanstack/react-query";
import { AccountsCard } from "./accounts-card";
import { TransactionsCard } from "./transactions-card";
import { KPIsCard } from "./kpis-card";
import { TrendsCard } from "./trends-card";
import { AlertCircle, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface MercuryStatus {
  connected: boolean;
  message?: string;
}

async function fetchMercuryStatus(): Promise<MercuryStatus> {
  const response = await fetch("/api/integrations/mercury/status");
  if (!response.ok) {
    return { connected: false, message: "Failed to check connection" };
  }
  return response.json();
}

function NotConnectedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="p-4 bg-amber-100 rounded-full mb-4">
        <AlertCircle className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Mercury Not Connected
      </h2>
      <p className="text-gray-500 max-w-md mb-6">
        Connect your Mercury account to view bank balances, transactions, and financial data.
      </p>
      <Button asChild>
        <Link href="/admin/integrations">
          Connect Mercury
          <ExternalLink className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export function FinancialsClient() {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["mercury", "status"],
    queryFn: fetchMercuryStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse flex items-center gap-2 text-gray-500">
          <DollarSign className="h-5 w-5" />
          Loading financials...
        </div>
      </div>
    );
  }

  if (!status?.connected) {
    return <NotConnectedState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financials</h1>
          <p className="text-gray-500">
            Bank accounts and transactions from Mercury
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            Mercury Connected
          </span>
        </div>
      </div>

      {/* KPIs */}
      <KPIsCard />

      {/* Trends */}
      <TrendsCard />

      {/* Accounts & Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AccountsCard />
        <TransactionsCard />
      </div>
    </div>
  );
}

