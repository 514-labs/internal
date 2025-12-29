/**
 * Mercury metric fetching
 *
 * Mercury metrics are derived from entities (accounts, transactions).
 */

import { fetchMercuryAccounts, fetchMercuryTransactions } from "../entities/mercury";
import type { MercuryMetricType } from "./types";

/**
 * Mercury metric configuration
 */
interface MercuryMetricConfig {
  accountId?: string;
}

/**
 * Fetch cash balance (sum of all account balances)
 */
async function fetchCashBalance(userId: string, config?: MercuryMetricConfig): Promise<number> {
  const accounts = await fetchMercuryAccounts(userId);

  if (config?.accountId) {
    const account = accounts.find((a) => a.id === config.accountId);
    return account?.currentBalance || 0;
  }

  return accounts.reduce((sum, account) => sum + account.currentBalance, 0);
}

/**
 * Fetch MRR (Monthly Recurring Revenue)
 *
 * This is a simplified implementation - real MRR calculation would need
 * to identify recurring transactions based on patterns or metadata.
 */
async function fetchMRR(userId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await fetchMercuryTransactions(userId, {
    start: thirtyDaysAgo.toISOString().split("T")[0],
  });

  // Sum positive (income) transactions
  // In a real implementation, this would filter for recurring revenue only
  const revenue = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return revenue;
}

/**
 * Fetch total revenue (last 30 days)
 */
async function fetchRevenue(userId: string): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await fetchMercuryTransactions(userId, {
    start: thirtyDaysAgo.toISOString().split("T")[0],
  });

  // Sum positive (income) transactions
  const revenue = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  return revenue;
}

/**
 * Fetch Mercury metric
 */
export async function fetchMercuryMetric(
  userId: string,
  type: MercuryMetricType,
  config?: MercuryMetricConfig
): Promise<number> {
  switch (type) {
    case "cashBalance":
      return fetchCashBalance(userId, config);
    case "mrr":
      return fetchMRR(userId);
    case "revenue":
      return fetchRevenue(userId);
    default:
      throw new Error(`Unknown Mercury metric type: ${type}`);
  }
}

