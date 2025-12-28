"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, PiggyBank, AlertCircle } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: string;
  status: string;
  currentBalance: number;
  availableBalance: number;
  accountNumber: string;
  routingNumber: string;
  createdAt: string;
}

interface TreasuryAccount {
  id: string;
  status: string;
  currentBalance: number;
  availableBalance: number;
  createdAt: string;
}

interface AccountsResponse {
  accounts: Account[];
}

interface TreasuryResponse {
  accounts: TreasuryAccount[];
}

async function fetchAccounts(): Promise<AccountsResponse> {
  const response = await fetch("/api/integrations/mercury/accounts");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch accounts");
  }
  const result = await response.json();
  return result.data;
}

async function fetchTreasury(): Promise<TreasuryResponse> {
  const response = await fetch("/api/integrations/mercury/treasury");
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch treasury");
  }
  const result = await response.json();
  return result.data;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function AccountSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>
  );
}

export function AccountsCard() {
  const {
    data: accountsData,
    isLoading: accountsLoading,
    error: accountsError,
  } = useQuery({
    queryKey: ["mercury", "accounts"],
    queryFn: fetchAccounts,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: treasuryData,
    isLoading: treasuryLoading,
    error: treasuryError,
  } = useQuery({
    queryKey: ["mercury", "treasury"],
    queryFn: fetchTreasury,
    staleTime: 1000 * 60 * 5,
  });

  const isLoading = accountsLoading || treasuryLoading;
  const error = accountsError || treasuryError;

  const bankBalance =
    accountsData?.accounts?.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    ) || 0;

  const treasuryBalance =
    treasuryData?.accounts?.reduce(
      (sum, acc) => sum + (acc.currentBalance || 0),
      0
    ) || 0;

  const totalBalance = bankBalance + treasuryBalance;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Landmark className="h-5 w-5 text-blue-600" />
            Accounts
          </CardTitle>
          {!isLoading && !error && (
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalBalance)}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">Mercury banking & treasury accounts</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <AccountSkeleton />
            <AccountSkeleton />
            <AccountSkeleton />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Unable to load accounts</p>
              <p className="text-sm text-amber-700">
                {error instanceof Error ? error.message : "Please check Mercury connection"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Treasury Accounts */}
            {treasuryData?.accounts?.map((account) => (
              <div
                key={account.id}
                className="p-4 border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white rounded-lg hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <PiggyBank className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Treasury</h3>
                      <p className="text-xs text-gray-500">Investment account</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      account.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Current Balance</span>
                    <span className="text-lg font-bold text-emerald-700">
                      {formatCurrency(account.currentBalance)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Available</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(account.availableBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Bank Accounts */}
            {accountsData?.accounts?.map((account) => (
              <div
                key={account.id}
                className="p-4 border rounded-lg hover:border-blue-200 hover:bg-blue-50/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Landmark className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {account.type?.toLowerCase()} • ****{account.accountNumber?.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      account.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {account.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Current Balance</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(account.currentBalance)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm text-gray-500">Available</span>
                    <span className="text-sm font-medium text-gray-700">
                      {formatCurrency(account.availableBalance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
