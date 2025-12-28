"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  ArrowLeftRight,
  Filter,
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

export interface Transaction {
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
  page: {
    nextPage?: string;
    previousPage?: string;
  };
}

interface FetchParams {
  status?: string;
  start?: string;
  end?: string;
  order?: "asc" | "desc";
  limit?: number;
  startAfter?: string;
  endBefore?: string;
}

const DEFAULT_PAGE_SIZE = 10;

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 per page" },
  { value: "25", label: "25 per page" },
  { value: "50", label: "50 per page" },
  { value: "100", label: "100 per page" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

async function fetchTransactions(params: FetchParams): Promise<TransactionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set("limit", (params.limit || DEFAULT_PAGE_SIZE).toString());
  searchParams.set("order", params.order || "desc");
  
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.start) searchParams.set("start", params.start);
  if (params.end) searchParams.set("end", params.end);
  if (params.startAfter) searchParams.set("startAfter", params.startAfter);
  if (params.endBefore) searchParams.set("endBefore", params.endBefore);

  const response = await fetch(`/api/integrations/mercury/transactions?${searchParams}`);
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
  }).format(absAmount);
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
  const [statusFilter, setStatusFilter] = useState("all");
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  
  // Cursor-based pagination state
  const [cursorStack, setCursorStack] = useState<string[]>([]); // Stack of previous page cursors
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: [
      "mercury",
      "transactions",
      statusFilter,
      pageSize,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
      currentCursor,
      isNavigatingBack,
    ],
    queryFn: () =>
      fetchTransactions({
        status: statusFilter !== "all" ? statusFilter : undefined,
        start: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        end: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
        order: "desc",
        limit: pageSize,
        startAfter: !isNavigatingBack ? currentCursor : undefined,
        endBefore: isNavigatingBack ? currentCursor : undefined,
      }),
    staleTime: 1000 * 60 * 2,
  });

  const transactions = data?.transactions || [];
  const hasNextPage = !!data?.page?.nextPage;
  const hasPreviousPage = cursorStack.length > 0;
  const hasFilters = statusFilter !== "all" || dateRange.from || dateRange.to;

  const goToNextPage = () => {
    if (data?.page?.nextPage && transactions.length > 0) {
      // Save current first transaction ID for going back
      setCursorStack((prev) => [...prev, transactions[0].id]);
      setCurrentCursor(data.page.nextPage);
      setIsNavigatingBack(false);
    }
  };

  const goToPreviousPage = () => {
    if (cursorStack.length > 0) {
      const newStack = [...cursorStack];
      const previousCursor = newStack.pop();
      setCursorStack(newStack);
      
      if (newStack.length === 0) {
        // Going back to first page
        setCurrentCursor(undefined);
        setIsNavigatingBack(false);
      } else {
        setCurrentCursor(previousCursor);
        setIsNavigatingBack(true);
      }
    }
  };

  const resetPagination = () => {
    setCursorStack([]);
    setCurrentCursor(undefined);
    setIsNavigatingBack(false);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setDateRange({ from: undefined, to: undefined });
    resetPagination();
  };

  const pageNumber = cursorStack.length + 1;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-green-600" />
            Transactions
          </CardTitle>
          {transactions.length > 0 && (
            <span className="text-sm text-gray-500 flex items-center gap-2">
              {isFetching && !isLoading && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              Page {pageNumber}
            </span>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              resetPagination();
            }}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <CalendarIcon className="h-3 w-3" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  resetPagination();
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Filters */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-gray-500 hover:text-gray-700"
              onClick={clearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Page Size Selector */}
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => {
              setPageSize(parseInt(value, 10));
              resetPagination();
            }}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: pageSize }).map((_, i) => (
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
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No transactions found</p>
            {hasFilters && (
              <Button variant="link" className="mt-2" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y">
              {transactions.map((tx) => {
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 line-clamp-1">
                          {displayName}
                        </p>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {formatDate(tx.postedAt || tx.createdAt)}
                          {description && ` • ${description}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
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

            {/* Pagination */}
            {(hasPreviousPage || hasNextPage) && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={!hasPreviousPage || isFetching}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {pageNumber}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={!hasNextPage || isFetching}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
