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

interface MonthlyBurnData {
  currentMonth: number;
  currentMonthLabel: string;
  lastMonth: number;
  lastMonthLabel: string;
}

function calculateMonthlyBurn(transactions: Transaction[]): MonthlyBurnData {
  // Find the most recent transaction date to use as reference
  const sortedByDate = [...transactions]
    .filter((tx) => tx.status !== "cancelled" && tx.status !== "failed")
    .sort((a, b) => {
      const dateA = new Date(a.postedAt || a.createdAt).getTime();
      const dateB = new Date(b.postedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

  if (sortedByDate.length === 0) {
    return {
      currentMonth: 0,
      currentMonthLabel: "",
      lastMonth: 0,
      lastMonthLabel: "",
    };
  }

  // Use the most recent transaction's month as "current"
  const mostRecentDate = new Date(sortedByDate[0].postedAt || sortedByDate[0].createdAt);
  
  // Current month boundaries (based on most recent transaction)
  const currentMonthStart = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 1);
  const currentMonthEnd = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth() + 1, 0);
  
  // Last month boundaries
  const lastMonthStart = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth() - 1, 1);
  const lastMonthEnd = new Date(mostRecentDate.getFullYear(), mostRecentDate.getMonth(), 0);

  // Filter transactions by month and only count outflows (expenses)
  const getMonthBurn = (startDate: Date, endDate: Date) => {
    return transactions
      .filter((tx) => {
        const txDate = new Date(tx.postedAt || tx.createdAt);
        return (
          txDate >= startDate &&
          txDate <= endDate &&
          tx.status !== "cancelled" &&
          tx.status !== "failed" &&
          tx.amount < 0 // Only outflows
        );
      })
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  };

  const currentMonthBurn = getMonthBurn(currentMonthStart, currentMonthEnd);
  const lastMonthBurn = getMonthBurn(lastMonthStart, lastMonthEnd);

  // Format month labels
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthLabel = monthNames[mostRecentDate.getMonth()];
  const lastMonthIdx = mostRecentDate.getMonth() === 0 ? 11 : mostRecentDate.getMonth() - 1;
  const lastMonthLabel = monthNames[lastMonthIdx];

  return {
    currentMonth: currentMonthBurn,
    currentMonthLabel,
    lastMonth: lastMonthBurn,
    lastMonthLabel,
  };
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
  const burnData = txData?.transactions
    ? calculateMonthlyBurn(txData.transactions)
    : { currentMonth: 0, currentMonthLabel: "", lastMonth: 0, lastMonthLabel: "" };

  // Use last month's burn for runway calculation (more complete data)
  const monthlyBurnForRunway = burnData.lastMonth > 0 ? burnData.lastMonth : burnData.currentMonth;

  // Calculate runway
  const runwayMonths = monthlyBurnForRunway > 0 ? totalCash / monthlyBurnForRunway : Infinity;

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

  // Calculate burn change percentage
  const burnChange = burnData.lastMonth > 0
    ? ((burnData.currentMonth - burnData.lastMonth) / burnData.lastMonth) * 100
    : 0;

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
                    <p className="text-xs text-gray-500">Total expenses per month</p>
                  </div>
                </div>
                {burnChange !== 0 && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    burnChange < 0 ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                  }`}>
                    {burnChange > 0 ? "+" : ""}{burnChange.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {/* Current Month */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">{burnData.currentMonthLabel} (Current)</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(burnData.currentMonth)}
                  </p>
                </div>
                {/* Last Month */}
                <div className="pt-2 border-t border-orange-100">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-gray-500">{burnData.lastMonthLabel} (Last month)</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatCurrency(burnData.lastMonth)}
                    </span>
                  </div>
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
                    <p className="text-xs text-gray-500">Based on {burnData.lastMonthLabel} burn rate</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${runwayStatus.bg} ${runwayStatus.color}`}>
                  {runwayStatus.status}
                </span>
              </div>
              <div className="space-y-3">
                <p className={`text-2xl font-bold ${runwayStatus.color}`}>
                  {runwayMonths === Infinity ? "∞" : formatMonths(runwayMonths)}
                </p>
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Cash position</span>
                    <span className="font-medium text-gray-700">{formatCurrency(totalCash)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Monthly burn</span>
                    <span className="font-medium text-gray-700">{formatCurrency(monthlyBurnForRunway)}/mo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

