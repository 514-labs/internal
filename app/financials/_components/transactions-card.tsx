"use client";

import { useState, useMemo } from "react";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  ArrowLeftRight,
  ArrowUpDown,
  Filter,
  CalendarIcon,
  X,
} from "lucide-react";
import { format } from "date-fns";

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

interface FetchParams {
  status?: string;
  start?: string;
  end?: string;
}

type SortOption = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const ITEMS_PER_PAGE = 10;
const MAX_TRANSACTIONS = 100; // Fetch more to enable proper sorting

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "sent", label: "Sent" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "date-desc", label: "Date (Newest)" },
  { value: "date-asc", label: "Date (Oldest)" },
  { value: "amount-desc", label: "Amount (High → Low)" },
  { value: "amount-asc", label: "Amount (Low → High)" },
];

async function fetchTransactions(params: FetchParams): Promise<TransactionsResponse> {
  const searchParams = new URLSearchParams();
  // Fetch more transactions to enable proper client-side sorting
  searchParams.set("limit", MAX_TRANSACTIONS.toString());
  if (params.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }
  if (params.start) searchParams.set("start", params.start);
  if (params.end) searchParams.set("end", params.end);

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
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "mercury",
      "transactions",
      statusFilter,
      dateRange.from?.toISOString(),
      dateRange.to?.toISOString(),
    ],
    queryFn: () =>
      fetchTransactions({
        status: statusFilter !== "all" ? statusFilter : undefined,
        start: dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
        end: dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
      }),
    staleTime: 1000 * 60 * 2,
  });

  // Sort transactions client-side
  const sortedTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    const sorted = [...data.transactions];
    
    switch (sortBy) {
      case "date-desc":
        sorted.sort(
          (a, b) =>
            new Date(b.postedAt || b.createdAt).getTime() -
            new Date(a.postedAt || a.createdAt).getTime()
        );
        break;
      case "date-asc":
        sorted.sort(
          (a, b) =>
            new Date(a.postedAt || a.createdAt).getTime() -
            new Date(b.postedAt || b.createdAt).getTime()
        );
        break;
      case "amount-desc":
        sorted.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
        break;
      case "amount-asc":
        sorted.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));
        break;
    }
    return sorted;
  }, [data?.transactions, sortBy]);

  // Client-side pagination of sorted results
  const totalPages = Math.ceil(sortedTransactions.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return sortedTransactions.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedTransactions, page]);
  const hasFilters = statusFilter !== "all" || dateRange.from || dateRange.to;

  const clearFilters = () => {
    setStatusFilter("all");
    setDateRange({ from: undefined, to: undefined });
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-green-600" />
            Transactions
          </CardTitle>
          {sortedTransactions.length > 0 && (
            <span className="text-sm text-gray-500">
              {sortedTransactions.length} transactions
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
              setPage(1);
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
                  setPage(1);
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                <ArrowUpDown className="h-3 w-3" />
                {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

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
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="divide-y">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
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
        ) : paginatedTransactions.length === 0 ? (
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
              {paginatedTransactions.map((tx) => {
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
            {sortedTransactions.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between pt-4 border-t mt-4">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNum);
                            }}
                            isActive={page === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
