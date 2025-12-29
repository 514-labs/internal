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
  kind: string;
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
  // Use order=desc to get most recent transactions first, limit=1000 (API max)
  const response = await fetch("/api/integrations/mercury/transactions?limit=1000&order=desc");
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

interface MonthBurn {
  amount: number;
  label: string;
}

interface MonthlyBurnData {
  months: MonthBurn[];
  averageBurn: number;
}

function calculateMonthlyBurn(transactions: Transaction[]): MonthlyBurnData {
  // Filter for actual expenses (outflows to external parties)
  // Exclude:
  // - Internal transfers (moving money between Mercury accounts)
  // - Treasury transfers (moving to/from treasury)
  // - Cancelled/failed transactions
  const INTERNAL_TRANSACTION_KINDS = [
    "internalTransfer",
    "treasuryTransfer",
  ];

  const validTransactions = transactions.filter(
    (tx) =>
      tx.status !== "cancelled" &&
      tx.status !== "failed" &&
      tx.amount < 0 &&
      !INTERNAL_TRANSACTION_KINDS.includes(tx.kind)
  );

  if (validTransactions.length === 0) {
    return {
      months: [],
      averageBurn: 0,
    };
  }

  // Group transactions by month
  const monthlyTotals = new Map<string, { total: number; date: Date }>();
  
  validTransactions.forEach((tx) => {
    const txDate = new Date(tx.postedAt || tx.createdAt);
    const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`;
    
    const existing = monthlyTotals.get(monthKey);
    if (existing) {
      existing.total += Math.abs(tx.amount);
    } else {
      monthlyTotals.set(monthKey, {
        total: Math.abs(tx.amount),
        date: new Date(txDate.getFullYear(), txDate.getMonth(), 1),
      });
    }
  });

  // Sort months by date (most recent first)
  const sortedMonths = Array.from(monthlyTotals.entries())
    .sort((a, b) => b[1].date.getTime() - a[1].date.getTime());

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const formatMonthLabel = (date: Date) => {
    const now = new Date();
    const monthName = monthNames[date.getMonth()];
    // Include year if not current year
    if (date.getFullYear() !== now.getFullYear()) {
      return `${monthName} ${date.getFullYear()}`;
    }
    return monthName;
  };

  // Get top 3 months
  const months: MonthBurn[] = sortedMonths.slice(0, 3).map((entry) => ({
    amount: entry[1].total,
    label: formatMonthLabel(entry[1].date),
  }));

  // Calculate average burn (exclude current month as it may be incomplete)
  const completedMonths = sortedMonths.slice(1, 4); // Skip current, take next 3
  const averageBurn = completedMonths.length > 0
    ? completedMonths.reduce((sum, m) => sum + m[1].total, 0) / completedMonths.length
    : months[0]?.amount || 0;

  return {
    months,
    averageBurn,
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
    : { months: [], averageBurn: 0 };

  // Use average burn for runway calculation (more stable than single month)
  const monthlyBurnForRunway = burnData.averageBurn;

  // Calculate runway
  const runwayMonths = monthlyBurnForRunway > 0 ? totalCash / monthlyBurnForRunway : Infinity;

  // Determine runway health status
  const getRunwayStatus = () => {
    if (runwayMonths === Infinity || runwayMonths > 18) {
      return { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", status: "Healthy" };
    } else if (runwayMonths > 12) {
      return { color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", status: "Good" };
    } else if (runwayMonths > 6) {
      return { color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", status: "Caution" };
    } else {
      return { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", status: "Critical" };
    }
  };

  const runwayStatus = getRunwayStatus();

  // Calculate burn change percentage (current vs last month)
  const currentMonth = burnData.months[0];
  const lastMonth = burnData.months[1];
  const burnChange = lastMonth && lastMonth.amount > 0
    ? ((currentMonth.amount - lastMonth.amount) / lastMonth.amount) * 100
    : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Financial KPIs</CardTitle>
        <p className="text-sm text-muted-foreground">Key performance indicators based on recent activity</p>
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
            <div className="p-4 border rounded-lg bg-orange-500/5 border-orange-500/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Flame className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Monthly Burn</h3>
                    <p className="text-xs text-muted-foreground">Last 3 months of expenses</p>
                  </div>
                </div>
                {burnChange !== 0 && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    burnChange < 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                  }`}>
                    {burnChange > 0 ? "+" : ""}{burnChange.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {burnData.months.map((month, index) => (
                  <div
                    key={month.label}
                    className={index === 0 ? "" : "pt-2 border-t border-orange-500/10"}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">
                        {month.label}
                        {index === 0 && " (Current)"}
                      </span>
                      <span className={`font-semibold ${index === 0 ? "text-lg text-orange-600 dark:text-orange-400" : "text-sm"}`}>
                        {formatCurrency(month.amount)}
                      </span>
                    </div>
                  </div>
                ))}
                {burnData.months.length === 0 && (
                  <p className="text-sm text-muted-foreground">No expense data available</p>
                )}
              </div>
            </div>

            {/* Runway Card */}
            <div className={`p-4 border rounded-lg ${
              runwayMonths > 18 ? "bg-emerald-500/5 border-emerald-500/20" :
              runwayMonths > 12 ? "bg-blue-500/5 border-blue-500/20" :
              runwayMonths > 6 ? "bg-amber-500/5 border-amber-500/20" :
              "bg-red-500/5 border-red-500/20"
            }`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${runwayStatus.bg}`}>
                    <Clock className={`h-5 w-5 ${runwayStatus.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Runway</h3>
                    <p className="text-xs text-muted-foreground">Based on 3-month average burn</p>
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
                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cash position</span>
                    <span className="font-medium">{formatCurrency(totalCash)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avg. monthly burn</span>
                    <span className="font-medium">{formatCurrency(monthlyBurnForRunway)}/mo</span>
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

