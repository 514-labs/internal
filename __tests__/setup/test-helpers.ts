/**
 * General test helpers and utilities
 */

import type { QueryOptions } from "@/lib/analytics/shared/types";
import { supabaseAnalyticsClient } from "@/lib/analytics/supabase/client";

/**
 * Create mock QueryOptions for testing
 */
export function createMockQueryOptions(
  overrides?: Partial<QueryOptions>
): QueryOptions {
  return {
    limit: 100,
    offset: 0,
    sortOrder: "desc" as const,
    ...overrides,
  };
}

/**
 * Create mock user data
 */
export function createMockUser(overrides?: {
  id?: string;
  email?: string;
  name?: string;
}) {
  return {
    id: overrides?.id || `user_${Date.now()}`,
    email: overrides?.email || `test-${Date.now()}@example.com`,
    name: overrides?.name || "Test User",
  };
}

/**
 * Setup test database
 * Creates necessary tables and seeds test data
 */
export async function setupTestDatabase(): Promise<void> {
  if (!supabaseAnalyticsClient.isConfigured()) {
    console.warn("Supabase not configured for tests - skipping DB setup");
    return;
  }

  const supabase = supabaseAnalyticsClient.getClient();

  // Ensure migrations are applied
  // Tables should already exist from migrations
  // Just verify the api_keys table exists
  const { error } = await supabase.from("api_keys").select("id").limit(1);

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows, which is OK
    throw new Error(`Test database setup failed: ${error.message}`);
  }
}

/**
 * Clean up test database
 * Removes test data after tests
 */
export async function cleanupTestDatabase(): Promise<void> {
  if (!supabaseAnalyticsClient.isConfigured()) {
    return;
  }

  const supabase = supabaseAnalyticsClient.getClient();

  // Delete all test API keys (user_id starts with 'test_' or 'user_test')
  await supabase
    .from("api_keys")
    .delete()
    .or("user_id.like.test_%,user_id.like.user_test%");
}

/**
 * Clean up all API keys for a specific user
 * Used in test cleanup to ensure complete removal
 */
export async function cleanupUserApiKeys(userId: string): Promise<void> {
  if (!supabaseAnalyticsClient.isConfigured()) {
    return;
  }

  const supabase = supabaseAnalyticsClient.getClient();

  // Delete all API keys for this specific user
  const { error } = await supabase
    .from("api_keys")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.warn(
      `Failed to cleanup API keys for user ${userId}:`,
      error.message
    );
  }
}

/**
 * Create a test API key in the database directly
 */
export async function createTestApiKey(options: {
  userId: string;
  keyHash: string;
  keyName?: string;
  revoked?: boolean;
}): Promise<string> {
  const supabase = supabaseAnalyticsClient.getClient();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: options.userId,
      key_hash: options.keyHash,
      key_name: options.keyName || "Test Key",
      revoked: options.revoked || false,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create test API key: ${error.message}`);
  }

  return data.id;
}

/**
 * Wait for a specified duration (for token expiration tests)
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a test API key hash
 */
export function generateTestKeyHash(seed: string = "test"): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(seed).digest("hex");
}
