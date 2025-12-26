/**
 * Mercury API integration
 * Handles per-user API token management and Mercury API calls
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

const INTEGRATION_NAME = "mercury";
const MERCURY_API_BASE_URL = "https://api.mercury.com/api/v1";

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
 * Mercury uses Basic auth: base64(apiKey:)
 *
 * @param token - The token to validate
 * @returns True if the token is valid
 */
export async function validateMercuryToken(token: string): Promise<boolean> {
  try {
    const authHeader = `Basic ${Buffer.from(`${token}:`).toString("base64")}`;

    const response = await fetch(`${MERCURY_API_BASE_URL}/accounts`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
      },
    });

    return response.ok;
  } catch (err) {
    console.error("[Mercury] Validation error:", err);
    return false;
  }
}

// ============================================================================
// Mercury API Client
// ============================================================================

/**
 * Mercury API client for making authenticated requests
 * Uses Basic authentication with the API token
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
  }

  /**
   * Get the Basic auth header for Mercury API
   */
  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.token}:`).toString("base64")}`;
  }

  /**
   * Make an authenticated request to the Mercury API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.token) {
      throw new ConfigurationError(
        "Client not initialized. Call initialize() first."
      );
    }

    const url = `${MERCURY_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.getAuthHeader(),
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      let errorBody: string | null = null;
      let errorDetails: Record<string, unknown> = {};
      try {
        const text = await response.text();
        errorBody = text;
        try {
          errorDetails = JSON.parse(text);
        } catch {
          // Not JSON, keep as text
        }
      } catch {
        // Couldn't read body
      }

      const errorMessage =
        errorDetails.message || errorDetails.error || errorBody;

      if (response.status === 401) {
        throw new AuthenticationError(
          `Mercury API authentication failed: ${
            errorMessage || "Your token may be invalid or expired."
          }`
        );
      }
      if (response.status === 403) {
        throw new ExternalAPIError(
          "Mercury",
          `Access forbidden: ${
            errorMessage || "Your token may not have the required permissions."
          }`,
          403
        );
      }
      throw new ExternalAPIError(
        "Mercury",
        `Request failed: ${errorMessage || `Status ${response.status}`}`,
        response.status
      );
    }

    return response.json();
  }

  // ==========================================================================
  // Accounts
  // ==========================================================================

  /**
   * Get all accounts
   */
  async getAccounts() {
    return this.request<{ accounts: unknown[] }>("/accounts");
  }

  /**
   * Get account by ID
   */
  async getAccount(accountId: string) {
    return this.request<unknown>(`/account/${accountId}`);
  }

  /**
   * Get cards for account
   */
  async getAccountCards(accountId: string) {
    return this.request<{ cards: unknown[] }>(`/account/${accountId}/cards`);
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
      status?: string;
    }
  ) {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    if (options?.start) params.set("start", options.start);
    if (options?.end) params.set("end", options.end);
    if (options?.status) params.set("status", options.status);

    const query = params.toString();
    return this.request<{ transactions: unknown[] }>(
      `/account/${accountId}/transactions${query ? `?${query}` : ""}`
    );
  }

  /**
   * List all transactions across all accounts
   */
  async listTransactions(options?: {
    limit?: number;
    offset?: number;
    start?: string;
    end?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    if (options?.start) params.set("start", options.start);
    if (options?.end) params.set("end", options.end);
    if (options?.status) params.set("status", options.status);

    const query = params.toString();
    return this.request<{ transactions: unknown[] }>(
      `/transactions${query ? `?${query}` : ""}`
    );
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string) {
    return this.request<unknown>(`/transaction/${transactionId}`);
  }

  // ==========================================================================
  // Recipients
  // ==========================================================================

  /**
   * Get all recipients
   */
  async getRecipients() {
    return this.request<{ recipients: unknown[] }>("/recipients");
  }

  /**
   * Get recipient by ID
   */
  async getRecipient(recipientId: string) {
    return this.request<unknown>(`/recipient/${recipientId}`);
  }

  // ==========================================================================
  // Organization
  // ==========================================================================

  /**
   * Get organization information
   */
  async getOrganization() {
    return this.request<unknown>("/organization");
  }

  // ==========================================================================
  // Users
  // ==========================================================================

  /**
   * Get all users
   */
  async getUsers() {
    return this.request<{ users: unknown[] }>("/users");
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string) {
    return this.request<unknown>(`/users/${userId}`);
  }

  // ==========================================================================
  // Categories
  // ==========================================================================

  /**
   * List all expense categories
   */
  async listCategories() {
    return this.request<{ categories: unknown[] }>("/categories");
  }

  // ==========================================================================
  // Treasury
  // ==========================================================================

  /**
   * Get all treasury accounts
   */
  async getTreasury() {
    return this.request<{ treasuryAccounts: unknown[] }>("/treasury");
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
