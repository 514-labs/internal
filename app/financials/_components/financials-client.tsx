"use client";

import { useQuery } from "@tanstack/react-query";
import { AccountsCard } from "./accounts-card";
import { TransactionsCard } from "./transactions-card";
import { KPIsCard } from "./kpis-card";
import { TrendsCard } from "./trends-card";
import { AlertCircle, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
    <Empty className="min-h-[400px] border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <AlertCircle className="h-6 w-6" />
        </EmptyMedia>
        <EmptyTitle>Mercury Not Connected</EmptyTitle>
        <EmptyDescription>
          Connect your Mercury account to view bank balances, transactions, and financial data.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/admin/integrations">
            Connect Mercury
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function FinancialsClient() {
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["mercury", "status"],
    queryFn: fetchMercuryStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">
          Bank accounts and transactions from Mercury
        </p>
      </div>

      {statusLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-5 w-5" />
            Loading financials...
          </div>
        </div>
      ) : !status?.connected ? (
        <NotConnectedState />
      ) : (
        <>
          {/* KPIs */}
          <KPIsCard />

          {/* Trends */}
          <TrendsCard />

          {/* Accounts & Transactions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AccountsCard />
            <TransactionsCard />
          </div>
        </>
      )}
    </div>
  );
}

