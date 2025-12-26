/**
 * Mercury API integration
 * Handles per-user API token management and Mercury API calls using the official SDK
 *
 * SECURITY CRITICAL:
 * - Each user has their own Mercury API token
 * - Tokens inherit the permissions of the Mercury user who created them
 * - Users must NEVER be able to access another user's token
 * - All functions scope operations to the requesting user's ID
 * - Tokens are encrypted with per-user keys before storage
 */

import { supabaseAnalyticsClient } from "../analytics/supabase/client";
import {
  ConfigurationError,
  ExternalAPIError,
  AuthenticationError,
} from "../analytics/shared/errors";
import { encryptToken, decryptToken, isEncrypted } from "../encryption";
import mercurySDK from "@api/mercurytechnologies";

const INTEGRATION_NAME = "mercury";

// ============================================================================
// Types
// ============================================================================

export interface MercuryTokenRecord {
  id: string;
  user_id: string;
  integration_name: string;
  access_token: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface MercuryConnectionStatus {
  connected: boolean;
  createdAt?: string;
  message?: string;
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Store a Mercury API token for the authenticated user
 *
 * SECURITY:
 * - Token is encrypted with a user-specific key before storage
 * - Only the same user (with correct userId) can decrypt it
 * - Even database access alone cannot reveal the token
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param token - The Mercury API token provided by the user
 */
export async function storeMercuryToken(
  userId: string,
  token: string
): Promise<void> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to store token");
  }

  if (!token || token.trim() === "") {
    throw new ConfigurationError("Mercury API token cannot be empty");
  }

  if (!supabaseAnalyticsClient.isConfigured()) {
    throw new ConfigurationError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  // Encrypt the token with a user-specific key
  const encryptedToken = encryptToken(token.trim(), userId);

  const supabase = supabaseAnalyticsClient.getClient();

  const tokenData = {
    user_id: userId,
    integration_name: INTEGRATION_NAME,
    access_token: encryptedToken,
    updated_at: new Date().toISOString(),
  };

  // Upsert token (replace if exists for this user + integration)
  const { error } = await supabase.from("user_integration_tokens").upsert(
    {
      ...tokenData,
      created_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,integration_name",
    }
  );

  if (error) {
    // SECURITY: Never include the token in error messages
    throw new ConfigurationError(
      `Failed to store Mercury token: ${error.message}`
    );
  }
}

/**
 * Retrieve the Mercury API token for the authenticated user
 *
 * SECURITY:
 * - Only returns the token for the requesting user
 * - Token is decrypted using a user-specific key
 * - Decryption will fail if userId doesn't match the encryption context
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @returns The decrypted token if found, null otherwise
 */
export async function getMercuryToken(userId: string): Promise<string | null> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to retrieve token");
  }

  if (!supabaseAnalyticsClient.isConfigured()) {
    return null;
  }

  const supabase = supabaseAnalyticsClient.getClient();

  const { data, error } = await supabase
    .from("user_integration_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .eq("integration_name", INTEGRATION_NAME)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned - no token stored
      return null;
    }
    // SECURITY: Never include potential token data in error messages
    console.error("Error retrieving Mercury token:", error.code);
    return null;
  }

  const storedToken = data?.access_token;
  if (!storedToken) {
    return null;
  }

  // Check if token is encrypted (for migration from plaintext)
  if (isEncrypted(storedToken)) {
    try {
      return decryptToken(storedToken, userId);
    } catch (err) {
      console.error("Error decrypting Mercury token:", (err as Error).message);
      return null;
    }
  }

  // Token is not encrypted (legacy) - return as-is but log a warning
  console.warn(
    "[Mercury] Found unencrypted token. It will be encrypted on next save."
  );
  return storedToken;
}

/**
 * Delete the Mercury API token for the authenticated user
 *
 * SECURITY: Only deletes the token for the requesting user
 * Cannot delete another user's token
 *
 * @param userId - The authenticated user's ID (from Clerk)
 */
export async function deleteMercuryToken(userId: string): Promise<void> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to delete token");
  }

  if (!supabaseAnalyticsClient.isConfigured()) {
    throw new ConfigurationError("Supabase is not configured");
  }

  const supabase = supabaseAnalyticsClient.getClient();

  const { error } = await supabase
    .from("user_integration_tokens")
    .delete()
    .eq("user_id", userId)
    .eq("integration_name", INTEGRATION_NAME);

  if (error) {
    throw new ConfigurationError(
      `Failed to delete Mercury token: ${error.message}`
    );
  }
}

/**
 * Check if the user has a Mercury connection
 *
 * @param userId - The authenticated user's ID
 * @returns Connection status
 */
export async function getMercuryConnectionStatus(
  userId: string
): Promise<MercuryConnectionStatus> {
  if (!userId) {
    return { connected: false, message: "Not authenticated" };
  }

  if (!supabaseAnalyticsClient.isConfigured()) {
    return { connected: false, message: "Database not configured" };
  }

  const supabase = supabaseAnalyticsClient.getClient();

  const { data, error } = await supabase
    .from("user_integration_tokens")
    .select("created_at")
    .eq("user_id", userId)
    .eq("integration_name", INTEGRATION_NAME)
    .single();

  if (error || !data) {
    return { connected: false };
  }

  return {
    connected: true,
    createdAt: data.created_at,
  };
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Validate a Mercury API token by making a test API call
 *
 * @param token - The token to validate
 * @returns True if the token is valid
 */
export async function validateMercuryToken(token: string): Promise<boolean> {
  try {
    // Configure SDK with the token and make a test call
    mercurySDK.auth(token);
    const response = await mercurySDK.getAccounts();
    return response.status === 200;
  } catch (err) {
    console.error("[Mercury] Validation error:", err);
    return false;
  }
}

// ============================================================================
// Mercury API Client
// ============================================================================

/**
 * Mercury API client wrapper for making authenticated requests
 *
 * SECURITY: The client is initialized with a userId and only uses that user's token
 */
export class MercuryClient {
  private userId: string;
  private token: string | null = null;

  constructor(userId: string) {
    if (!userId) {
      throw new AuthenticationError("User ID is required");
    }
    this.userId = userId;
  }

  /**
   * Initialize the client by loading the user's token
   */
  async initialize(): Promise<void> {
    this.token = await getMercuryToken(this.userId);
    if (!this.token) {
      throw new ConfigurationError(
        "Mercury is not connected. Please add your API token in Settings > Integrations."
      );
    }
    // Configure the SDK with the user's token
    mercurySDK.auth(this.token);
  }

  /**
   * Handle SDK errors and convert to our error types
   */
  private handleError(error: unknown, operation: string): never {
    const err = error as { status?: number; data?: { message?: string } };
    const message = err.data?.message || (error as Error).message || "Unknown error";
    
    if (err.status === 401) {
      throw new AuthenticationError(
        `Mercury API authentication failed: ${message}. Your token may be invalid or expired.`
      );
    }
    if (err.status === 403) {
      throw new ExternalAPIError(
        "Mercury",
        `Access forbidden: ${message}. Your token may not have the required permissions.`,
        403
      );
    }
    throw new ExternalAPIError(
      "Mercury",
      `${operation} failed: ${message}`,
      err.status || 500
    );
  }

  // ==========================================================================
  // Accounts
  // ==========================================================================

  /**
   * Get all accounts
   */
  async getAccounts() {
    try {
      const response = await mercurySDK.getAccounts();
      return response.data;
    } catch (error) {
      this.handleError(error, "Get accounts");
    }
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string) {
    try {
      const response = await mercurySDK.getAccount({ accountId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Get account");
    }
  }

  /**
   * Get cards for account
   */
  async getAccountCards(accountId: string) {
    try {
      const response = await mercurySDK.getAccountCards({ accountId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Get account cards");
    }
  }

  // ==========================================================================
  // Transactions
  // ==========================================================================

  /**
   * List transactions for an account
   */
  async listAccountTransactions(
    accountId: string,
    options?: {
      limit?: number;
      offset?: number;
      start?: string;
      end?: string;
      status?: "pending" | "sent" | "cancelled" | "failed" | "reversed" | "blocked";
      search?: string;
    }
  ) {
    try {
      const response = await mercurySDK.listAccountTransactions({
        accountId,
        ...options,
      });
      return response.data;
    } catch (error) {
      this.handleError(error, "List account transactions");
    }
  }

  /**
   * List all transactions across all accounts
   */
  async listTransactions(options?: {
    limit?: number;
    offset?: number;
    start?: string;
    end?: string;
    status?: ("pending" | "sent" | "cancelled" | "failed" | "reversed" | "blocked")[];
  }) {
    try {
      const response = await mercurySDK.listTransactions(options);
      return response.data;
    } catch (error) {
      this.handleError(error, "List transactions");
    }
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(accountId: string, transactionId: string) {
    try {
      const response = await mercurySDK.getTransaction({ accountId, transactionId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Get transaction");
    }
  }

  /**
   * Get transaction by ID (without account ID)
   */
  async getTransactionById(transactionId: string) {
    try {
      const response = await mercurySDK.getTransactionById({ transactionId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Get transaction by ID");
    }
  }

  // ==========================================================================
  // Recipients
  // ==========================================================================

  /**
   * Get all recipients
   */
  async getRecipients(options?: { limit?: number }) {
    try {
      const response = await mercurySDK.getRecipients(options);
      return response.data;
    } catch (error) {
      this.handleError(error, "Get recipients");
    }
  }

  /**
   * Get recipient by ID
   */
  async getRecipient(recipientId: string) {
    try {
      const response = await mercurySDK.getRecipient({ recipientId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Get recipient");
    }
  }

  // ==========================================================================
  // Organization
  // ==========================================================================

  /**
   * Get organization information
   */
  async getOrganization() {
    try {
      const response = await mercurySDK.getOrganization();
      return response.data;
    } catch (error) {
      this.handleError(error, "Get organization");
    }
  }

  // ==========================================================================
  // Users
  // ==========================================================================

  /**
   * Get all users
   */
  async getUsers() {
    try {
      const response = await mercurySDK.getUsers();
      return response.data;
    } catch (error) {
      this.handleError(error, "Get users");
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    try {
      const response = await mercurySDK.getUser({ userId });
      return response.data;
    } catch (error) {
      this.handleError(error, "Get user");
    }
  }

  // ==========================================================================
  // Categories
  // ==========================================================================

  /**
   * List all expense categories
   */
  async listCategories() {
    try {
      const response = await mercurySDK.listCategories();
      return response.data;
    } catch (error) {
      this.handleError(error, "List categories");
    }
  }

  // ==========================================================================
  // Credit
  // ==========================================================================

  /**
   * List all credit accounts
   */
  async listCredit() {
    try {
      const response = await mercurySDK.listCredit();
      return response.data;
    } catch (error) {
      this.handleError(error, "List credit");
    }
  }

  // ==========================================================================
  // Treasury
  // ==========================================================================

  /**
   * Get all treasury accounts
   */
  async getTreasury() {
    try {
      const response = await mercurySDK.getTreasury();
      return response.data;
    } catch (error) {
      this.handleError(error, "Get treasury");
    }
  }
}

/**
 * Create an initialized Mercury client for a user
 *
 * @param userId - The authenticated user's ID
 * @returns Initialized MercuryClient
 */
export async function createMercuryClient(
  userId: string
): Promise<MercuryClient> {
  const client = new MercuryClient(userId);
  await client.initialize();
  return client;
}

