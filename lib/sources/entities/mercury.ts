/**
 * Mercury entity fetching
 */

import { createMercuryClient } from "../connectors/mercury/client";
import type { MercuryAccount, MercuryTransaction, Entity } from "./types";

/**
 * Fetch Mercury accounts
 */
export async function fetchMercuryAccounts(userId: string): Promise<MercuryAccount[]> {
  const client = await createMercuryClient(userId);
  const response = await client.getAccounts();

  if (!response?.accounts || !Array.isArray(response.accounts)) {
    return [];
  }

  return (response.accounts as Array<{
    id: string;
    name?: string;
    type?: string;
    currentBalance?: number;
    availableBalance?: number;
    currency?: string;
  }>).map((account) => ({
    id: account.id,
    name: account.name || "",
    type: account.type || "unknown",
    currentBalance: account.currentBalance || 0,
    availableBalance: account.availableBalance || 0,
    currency: account.currency || "USD",
  }));
}

/**
 * Fetch Mercury transactions
 */
export async function fetchMercuryTransactions(
  userId: string,
  filters?: { accountId?: string; start?: string; end?: string }
): Promise<MercuryTransaction[]> {
  const client = await createMercuryClient(userId);

  const response = await client.listTransactions({
    start: filters?.start,
    end: filters?.end,
    limit: 500,
  });

  if (!response?.transactions || !Array.isArray(response.transactions)) {
    return [];
  }

  return (response.transactions as Array<{
    id: string;
    amount?: number;
    counterpartyName?: string;
    status?: string;
    postedDate?: string;
    createdAt?: string;
  }>).map((tx) => ({
    id: tx.id,
    amount: tx.amount || 0,
    counterpartyName: tx.counterpartyName || "",
    status: tx.status || "unknown",
    postedDate: tx.postedDate,
    createdAt: tx.createdAt || new Date().toISOString(),
  }));
}

/**
 * Fetch Mercury treasury accounts
 */
export async function fetchMercuryTreasury(userId: string): Promise<Entity[]> {
  const client = await createMercuryClient(userId);
  const response = await client.getTreasury();

  if (!response?.treasuryAccounts || !Array.isArray(response.treasuryAccounts)) {
    return [];
  }

  return (response.treasuryAccounts as Array<Record<string, unknown> & { id: string }>).map((account) => ({
    ...account,
    id: account.id,
  }));
}

/**
 * Generic Mercury entity fetcher
 */
export async function fetchMercuryEntity(
  userId: string,
  type: string,
  filters?: Record<string, unknown>
): Promise<Entity[]> {
  switch (type) {
    case "account":
      return fetchMercuryAccounts(userId);
    case "transaction":
      return fetchMercuryTransactions(
        userId,
        filters as { accountId?: string; start?: string; end?: string }
      );
    case "treasury":
      return fetchMercuryTreasury(userId);
    default:
      throw new Error(`Unknown Mercury entity type: ${type}`);
  }
}

