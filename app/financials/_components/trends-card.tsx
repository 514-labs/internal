"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Lightbulb,
  Flame,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  postedAt: string;
  createdAt: string;
  status: string;
  kind: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
}

interface MonthlyBurnData {
  month: string;
  monthLabel: string;
  burn: number;
  year: number;
}

// Transaction kinds to exclude from burn calculation
const INTERNAL_TRANSACTION_KINDS = ["internalTransfer", "treasuryTransfer"];

async function fetchTransactions(): Promise<TransactionsResponse> {
  // Fetch up to 1000 transactions for 12-month analysis
  const response = await fetch(
    "/api/integrations/mercury/transactions?limit=1000&order=desc"
  );
  if (!response.ok) throw new Error("Failed to fetch transactions");
  const result = await response.json();
  return result.data;
}

function calculateMonthlyBurnTrend(
  transactions: Transaction[]
): MonthlyBurnData[] {
  // Filter for actual expenses (outflows to external parties)
  const validTransactions = transactions.filter(
    (tx) =>
      tx.status !== "cancelled" &&
      tx.status !== "failed" &&
      tx.amount < 0 &&
      !INTERNAL_TRANSACTION_KINDS.includes(tx.kind)
  );

  if (validTransactions.length === 0) {
    return [];
  }

  // Group transactions by month
  const monthlyTotals = new Map<string, { total: number; date: Date }>();

  validTransactions.forEach((tx) => {
    const txDate = new Date(tx.postedAt || tx.createdAt);
    const monthKey = `${txDate.getFullYear()}-${String(txDate.getMonth() + 1).padStart(2, "0")}`;

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

  // Sort months by date (oldest first for chart)
  const sortedMonths = Array.from(monthlyTotals.entries()).sort(
    (a, b) => a[1].date.getTime() - b[1].date.getTime()
  );

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Take last 12 months
  const last12Months = sortedMonths.slice(-12);

  return last12Months.map((entry) => ({
    month: entry[0],
    monthLabel: monthNames[entry[1].date.getMonth()],
    burn: Math.round(entry[1].total),
    year: entry[1].date.getFullYear(),
  }));
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const burnChartConfig = {
  burn: {
    label: "Monthly Burn",
    color: "#f97316", // Orange for burn
  },
} satisfies ChartConfig;

interface TrendInsight {
  title: string;
  description: string;
  type: "positive" | "neutral" | "warning";
}

function generateTrendInsight(
  monthlyBurn: MonthlyBurnData[],
  avgBurn: number
): TrendInsight {
  if (monthlyBurn.length < 2) {
    return {
      title: "Limited Data",
      description: "Not enough data to identify trends yet.",
      type: "neutral",
    };
  }

  const latestMonth = monthlyBurn[monthlyBurn.length - 1];
  const previousMonth = monthlyBurn[monthlyBurn.length - 2];

  const latestBurn = latestMonth?.burn || 0;
  const previousBurn = previousMonth?.burn || 0;
  const monthOverMonthChange =
    previousBurn > 0 ? ((latestBurn - previousBurn) / previousBurn) * 100 : 0;

  // Calculate 3-month trend if available
  const recentThreeMonths = monthlyBurn.slice(-3);
  const olderThreeMonths = monthlyBurn.slice(-6, -3);

  const recentAvg =
    recentThreeMonths.reduce((sum, m) => sum + m.burn, 0) /
    recentThreeMonths.length;
  const olderAvg =
    olderThreeMonths.length > 0
      ? olderThreeMonths.reduce((sum, m) => sum + m.burn, 0) /
        olderThreeMonths.length
      : recentAvg;

  const quarterlyTrend =
    olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  // Find highest and lowest months
  const sortedByBurn = [...monthlyBurn].sort((a, b) => b.burn - a.burn);
  const highestMonth = sortedByBurn[0];
  const lowestMonth = sortedByBurn[sortedByBurn.length - 1];

  // Generate insight based on patterns
  if (monthOverMonthChange < -15) {
    return {
      title: "Spending Decreased",
      description: `Your burn rate dropped ${Math.abs(monthOverMonthChange).toFixed(0)}% from ${previousMonth.monthLabel} to ${latestMonth.monthLabel}. ${
        quarterlyTrend < 0
          ? `This continues a downward trend, with spending down ${Math.abs(quarterlyTrend).toFixed(0)}% over the past quarter.`
          : "Keep monitoring to see if this becomes a sustained trend."
      }`,
      type: "positive",
    };
  }

  if (monthOverMonthChange > 15) {
    return {
      title: "Spending Increased",
      description: `Your burn rate increased ${monthOverMonthChange.toFixed(0)}% from ${previousMonth.monthLabel} to ${latestMonth.monthLabel}. ${
        latestBurn > avgBurn * 1.2
          ? `${latestMonth.monthLabel} was ${((latestBurn / avgBurn - 1) * 100).toFixed(0)}% above your ${monthlyBurn.length}-month average.`
          : "This is within normal variation for your spending patterns."
      }`,
      type: monthOverMonthChange > 25 ? "warning" : "neutral",
    };
  }

  if (quarterlyTrend < -10) {
    return {
      title: "Quarterly Trend: Decreasing",
      description: `Your average monthly spend has decreased ${Math.abs(quarterlyTrend).toFixed(0)}% over the past 3 months compared to the prior quarter. You're on track to extend your runway.`,
      type: "positive",
    };
  }

  if (quarterlyTrend > 10) {
    return {
      title: "Quarterly Trend: Increasing",
      description: `Your average monthly spend has increased ${quarterlyTrend.toFixed(0)}% over the past 3 months compared to the prior quarter. Consider reviewing expense categories to understand the drivers.`,
      type: "warning",
    };
  }

  // Check for high variance
  const variance =
    monthlyBurn.reduce((sum, m) => sum + Math.pow(m.burn - avgBurn, 2), 0) /
    monthlyBurn.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = (stdDev / avgBurn) * 100;

  if (coefficientOfVariation > 25) {
    return {
      title: "Variable Spending Pattern",
      description: `Your monthly burn varies significantly, ranging from ${formatCurrency(lowestMonth.burn)} (${lowestMonth.monthLabel}) to ${formatCurrency(highestMonth.burn)} (${highestMonth.monthLabel}). This may be due to seasonal factors or one-time expenses.`,
      type: "neutral",
    };
  }

  return {
    title: "Stable Burn Rate",
    description: `Your spending has remained relatively stable, averaging ${formatCurrency(avgBurn)} per month over the past ${monthlyBurn.length} months. ${latestMonth.monthLabel}'s burn of ${formatCurrency(latestBurn)} is within normal range.`,
    type: "positive",
  };
}

// ============================================
// Historical Burn Card Component
// ============================================

interface HistoricalBurnCardProps {
  monthlyBurn: MonthlyBurnData[];
  avgBurn: number;
}

function HistoricalBurnCard({ monthlyBurn, avgBurn }: HistoricalBurnCardProps) {
  const latestBurn = monthlyBurn[monthlyBurn.length - 1]?.burn || 0;
  const previousBurn = monthlyBurn[monthlyBurn.length - 2]?.burn || 0;

  const trendDirection = latestBurn > previousBurn ? "up" : "down";
  const trendPercent =
    previousBurn > 0
      ? Math.abs(((latestBurn - previousBurn) / previousBurn) * 100)
      : 0;

  const insight = generateTrendInsight(monthlyBurn, avgBurn);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-base">Historical Burn</CardTitle>
              <p className="text-sm text-gray-500">
                Monthly expenses over the last {monthlyBurn.length} months
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Average</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(avgBurn)}/mo
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Trend Summary */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
          <div>
            <p className="text-sm text-gray-500">Latest Month</p>
            <p className="text-xl font-bold text-gray-900">
              {formatFullCurrency(latestBurn)}
            </p>
          </div>
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              trendDirection === "down"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {trendDirection === "down" ? "↓" : "↑"} {trendPercent.toFixed(0)}%
            vs prev
          </div>
        </div>

        {/* Chart */}
        <ChartContainer config={burnChartConfig} className="h-[240px] w-full">
          <BarChart
            accessibilityLayer
            data={monthlyBurn}
            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
              width={60}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">
                        {item.payload.monthLabel} {item.payload.year}
                      </span>
                      <span className="text-orange-600 font-semibold">
                        {formatFullCurrency(value as number)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="burn"
              fill="var(--color-burn)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>

        {/* Trend Insight */}
        <div
          className={`mt-4 p-4 rounded-lg border ${
            insight.type === "positive"
              ? "bg-emerald-50 border-emerald-200"
              : insight.type === "warning"
                ? "bg-amber-50 border-amber-200"
                : "bg-slate-50 border-slate-200"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-lg ${
                insight.type === "positive"
                  ? "bg-emerald-100"
                  : insight.type === "warning"
                    ? "bg-amber-100"
                    : "bg-slate-100"
              }`}
            >
              {insight.type === "positive" ? (
                <TrendingDown className="h-4 w-4 text-emerald-600" />
              ) : insight.type === "warning" ? (
                <TrendingUp className="h-4 w-4 text-amber-600" />
              ) : (
                <Lightbulb className="h-4 w-4 text-slate-600" />
              )}
            </div>
            <div className="flex-1">
              <h4
                className={`font-semibold text-sm ${
                  insight.type === "positive"
                    ? "text-emerald-800"
                    : insight.type === "warning"
                      ? "text-amber-800"
                      : "text-slate-800"
                }`}
              >
                {insight.title}
              </h4>
              <p
                className={`text-sm mt-1 ${
                  insight.type === "positive"
                    ? "text-emerald-700"
                    : insight.type === "warning"
                      ? "text-amber-700"
                      : "text-slate-600"
                }`}
              >
                {insight.description}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Skeleton Components
// ============================================

function TrendCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  );
}

function TrendsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-1">
        <TrendCardSkeleton />
      </div>
    </div>
  );
}

// ============================================
// Main TrendsCard Container
// ============================================

export function TrendsCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["mercury", "trends"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  if (isLoading) {
    return <TrendsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Financial Trends
            </h2>
            <p className="text-gray-500">
              Historical patterns and insights from your financial data
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">
                Unable to load trends
              </p>
              <p className="text-sm text-amber-700">
                {error instanceof Error
                  ? error.message
                  : "Please check Mercury connection"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const monthlyBurn = data?.transactions
    ? calculateMonthlyBurnTrend(data.transactions)
    : [];

  if (monthlyBurn.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Financial Trends
            </h2>
            <p className="text-gray-500">
              Historical patterns and insights from your financial data
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">
              Not enough transaction data to display trends
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const avgBurn =
    monthlyBurn.reduce((sum, m) => sum + m.burn, 0) / monthlyBurn.length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <TrendingUp className="h-5 w-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Financial Trends
          </h2>
          <p className="text-gray-500">
            Historical patterns and insights from your financial data
          </p>
        </div>
      </div>

      {/* Trend Cards Grid */}
      <div className="grid gap-4 lg:grid-cols-1">
        {/* Historical Burn Card */}
        <HistoricalBurnCard monthlyBurn={monthlyBurn} avgBurn={avgBurn} />

        {/* Future cards can be added here:
            - Cash Flow Trend
            - Revenue Trend
            - Expense Categories
            etc.
        */}
      </div>
    </div>
  );
}
