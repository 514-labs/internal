"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  Flame,
} from "lucide-react";

interface Account {
  id: string;
  currentBalance: number;
}

interface TreasuryAccount {
  id: string;
  currentBalance: number;
}

interface Transaction {
  id: string;
  amount: number;
  postedAt: string;
  createdAt: string;
  status: string;
}

interface AccountsResponse {
  accounts: Account[];
}

interface TreasuryResponse {
  accounts: TreasuryAccount[];
}

interface TransactionsResponse {
  transactions: Transaction[];
}

async function fetchAccounts(): Promise<AccountsResponse> {
  const response = await fetch("/api/integrations/mercury/accounts");
  if (!response.ok) throw new Error("Failed to fetch accounts");
  const result = await response.json();
  return result.data;
}

async function fetchTreasury(): Promise<TreasuryResponse> {
  const response = await fetch("/api/integrations/mercury/treasury");
  if (!response.ok) throw new Error("Failed to fetch treasury");
  const result = await response.json();
  return result.data;
}

async function fetchTransactions(): Promise<TransactionsResponse> {
  const response = await fetch("/api/integrations/mercury/transactions?limit=500");
  if (!response.ok) throw new Error("Failed to fetch transactions");
  const result = await response.json();
  return result.data;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatMonths(months: number): string {
  if (months >= 24) {
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years}+ years`;
  }
  return `${Math.round(months)} months`;
}

function calculateMonthlyBurn(transactions: Transaction[]): number {
  // Get transactions from the last 3 months for a more accurate average
  const now = new Date();
  const threeMonthsAgo = new Date(now);
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const recentTransactions = transactions.filter((tx) => {
    const txDate = new Date(tx.postedAt || tx.createdAt);
    return txDate >= threeMonthsAgo && tx.status !== "cancelled" && tx.status !== "failed";
  });

  // Sum all negative (outgoing) transactions
  const totalOutflow = recentTransactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  // Sum all positive (incoming) transactions
  const totalInflow = recentTransactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  // Net burn = outflow - inflow (positive means burning cash)
  const netBurn = totalOutflow - totalInflow;

  // Calculate number of months in the period
  const oldestTx = recentTransactions.reduce((oldest, tx) => {
    const txDate = new Date(tx.postedAt || tx.createdAt);
    return txDate < oldest ? txDate : oldest;
  }, now);

  const monthsInPeriod = Math.max(
    1,
    (now.getTime() - oldestTx.getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  // Return monthly average
  return netBurn / monthsInPeriod;
}

function KPISkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function KPIsCard() {
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ["mercury", "accounts"],
    queryFn: fetchAccounts,
    staleTime: 1000 * 60 * 5,
  });

  const { data: treasuryData, isLoading: treasuryLoading } = useQuery({
    queryKey: ["mercury", "treasury"],
    queryFn: fetchTreasury,
    staleTime: 1000 * 60 * 5,
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["mercury", "transactions", "kpis"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = accountsLoading || treasuryLoading || txLoading;

  // Calculate total cash position
  const bankBalance =
    accountsData?.accounts?.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0) || 0;
  const treasuryBalance =
    treasuryData?.accounts?.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0) || 0;
  const totalCash = bankBalance + treasuryBalance;

  // Calculate burn rate
  const monthlyBurn = txData?.transactions
    ? calculateMonthlyBurn(txData.transactions)
    : 0;

  // Calculate runway
  const runwayMonths = monthlyBurn > 0 ? totalCash / monthlyBurn : Infinity;

  // Determine runway health status
  const getRunwayStatus = () => {
    if (runwayMonths === Infinity || runwayMonths > 18) {
      return { color: "text-emerald-600", bg: "bg-emerald-100", status: "Healthy" };
    } else if (runwayMonths > 12) {
      return { color: "text-blue-600", bg: "bg-blue-100", status: "Good" };
    } else if (runwayMonths > 6) {
      return { color: "text-amber-600", bg: "bg-amber-100", status: "Caution" };
    } else {
      return { color: "text-red-600", bg: "bg-red-100", status: "Critical" };
    }
  };

  const runwayStatus = getRunwayStatus();

  // Determine burn status
  const getBurnStatus = () => {
    if (monthlyBurn <= 0) {
      return { color: "text-emerald-600", bg: "bg-emerald-100", label: "Net Positive" };
    } else if (monthlyBurn < 50000) {
      return { color: "text-blue-600", bg: "bg-blue-100", label: "Low Burn" };
    } else if (monthlyBurn < 150000) {
      return { color: "text-amber-600", bg: "bg-amber-100", label: "Moderate" };
    } else {
      return { color: "text-red-600", bg: "bg-red-100", label: "High Burn" };
    }
  };

  const burnStatus = getBurnStatus();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Financial KPIs</CardTitle>
        <p className="text-sm text-gray-500">Key performance indicators based on recent activity</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <KPISkeleton />
            <KPISkeleton />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Burn Rate Card */}
            <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-white border-orange-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Monthly Burn</h3>
                    <p className="text-xs text-gray-500">3-month average net burn</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${burnStatus.bg} ${burnStatus.color}`}>
                  {burnStatus.label}
                </span>
              </div>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${monthlyBurn > 0 ? "text-orange-600" : "text-emerald-600"}`}>
                  {monthlyBurn > 0 ? "-" : "+"}
                  {formatCurrency(Math.abs(monthlyBurn))}
                  <span className="text-sm font-normal text-gray-500">/mo</span>
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <TrendingDown className="h-3 w-3" />
                  <span>
                    Based on {txData?.transactions?.length || 0} transactions
                  </span>
                </div>
              </div>
            </div>

            {/* Runway Card */}
            <div className={`p-4 border rounded-lg bg-gradient-to-br ${
              runwayMonths > 18 ? "from-emerald-50 to-white border-emerald-200" :
              runwayMonths > 12 ? "from-blue-50 to-white border-blue-200" :
              runwayMonths > 6 ? "from-amber-50 to-white border-amber-200" :
              "from-red-50 to-white border-red-200"
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${runwayStatus.bg}`}>
                    <Clock className={`h-5 w-5 ${runwayStatus.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Runway</h3>
                    <p className="text-xs text-gray-500">Months of cash remaining</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${runwayStatus.bg} ${runwayStatus.color}`}>
                  {runwayStatus.status}
                </span>
              </div>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${runwayStatus.color}`}>
                  {runwayMonths === Infinity ? "∞" : formatMonths(runwayMonths)}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {runwayMonths > 12 ? (
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                  )}
                  <span>
                    {formatCurrency(totalCash)} cash / {formatCurrency(Math.abs(monthlyBurn))}/mo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

