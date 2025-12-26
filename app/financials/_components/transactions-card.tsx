"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  ArrowLeftRight,
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  counterpartyName: string;
  counterpartyNickname?: string;
  note?: string;
  externalMemo?: string;
  postedAt: string;
  createdAt: string;
  kind: string;
  bankDescription?: string;
}

interface TransactionsResponse {
  transactions: Transaction[];
  total?: number;
}

async function fetchTransactions(): Promise<TransactionsResponse> {
  const response = await fetch("/api/integrations/mercury/transactions?limit=20");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch transactions");
  }
  const result = await response.json();
  return result.data;
}

function formatCurrency(amount: number): string {
  const absAmount = Math.abs(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(absAmount); // Mercury returns dollars, not cents
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function TransactionsCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["mercury", "transactions"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-green-600" />
            Recent Transactions
          </CardTitle>
          {data?.transactions && (
            <span className="text-sm text-gray-500">
              {data.transactions.length} transactions
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">Latest activity across all accounts</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <TransactionSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Unable to load transactions</p>
              <p className="text-sm text-amber-700">
                {error instanceof Error ? error.message : "Please check Mercury connection"}
              </p>
            </div>
          </div>
        ) : data?.transactions?.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No transactions found</p>
        ) : (
          <div className="divide-y">
            {data?.transactions?.map((tx) => {
              const isCredit = tx.amount > 0;
              const displayName =
                tx.counterpartyNickname ||
                tx.counterpartyName ||
                tx.bankDescription ||
                "Unknown";
              const description = tx.note || tx.externalMemo || tx.kind;

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        isCredit
                          ? "bg-green-100 text-green-600"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">
                        {displayName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.postedAt || tx.createdAt)}
                        {description && ` • ${description}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        isCredit ? "text-green-600" : "text-gray-900"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </p>
                    <p
                      className={`text-xs capitalize ${
                        tx.status === "pending"
                          ? "text-amber-600"
                          : tx.status === "sent" || tx.status === "completed"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {tx.status}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

