/**
 * Rippling API integration
 * Handles per-user API token management and Rippling API calls
 *
 * SECURITY CRITICAL:
 * - Each user has their own Rippling API token
 * - Tokens inherit the permissions of the Rippling user who created them
 * - Users must NEVER be able to access another user's token
 * - All functions scope operations to the requesting user's ID
 */

import { supabaseAnalyticsClient } from "../analytics/supabase/client";
import {
  ConfigurationError,
  ExternalAPIError,
  AuthenticationError,
} from "../analytics/shared/errors";

const INTEGRATION_NAME = "rippling";
const RIPPLING_API_BASE_URL =
  process.env.RIPPLING_API_BASE_URL || "https://rest.ripplingapis.com";

// ============================================================================
// Types
// ============================================================================

export interface RipplingTokenRecord {
  id: string;
  user_id: string;
  integration_name: string;
  access_token: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface RipplingConnectionStatus {
  connected: boolean;
  createdAt?: string;
  message?: string;
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Store a Rippling API token for the authenticated user
 *
 * SECURITY: Token is stored scoped to the userId - only this user can retrieve it
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @param token - The Rippling API token provided by the user
 */
export async function storeRipplingToken(
  userId: string,
  token: string
): Promise<void> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to store token");
  }

  if (!token || token.trim() === "") {
    throw new ConfigurationError("Rippling API token cannot be empty");
  }

  if (!supabaseAnalyticsClient.isConfigured()) {
    throw new ConfigurationError(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
    );
  }

  const supabase = supabaseAnalyticsClient.getClient();

  const tokenData = {
    user_id: userId,
    integration_name: INTEGRATION_NAME,
    access_token: token,
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
      `Failed to store Rippling token: ${error.message}`
    );
  }
}

/**
 * Retrieve the Rippling API token for the authenticated user
 *
 * SECURITY: Only returns the token for the requesting user
 * There is no way to request another user's token
 *
 * @param userId - The authenticated user's ID (from Clerk)
 * @returns The token if found, null otherwise
 */
export async function getRipplingToken(userId: string): Promise<string | null> {
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
    console.error("Error retrieving Rippling token:", error.code);
    return null;
  }

  return data?.access_token ?? null;
}

/**
 * Delete the Rippling API token for the authenticated user
 *
 * SECURITY: Only deletes the token for the requesting user
 * Cannot delete another user's token
 *
 * @param userId - The authenticated user's ID (from Clerk)
 */
export async function deleteRipplingToken(userId: string): Promise<void> {
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
      `Failed to delete Rippling token: ${error.message}`
    );
  }
}

/**
 * Check if the user has a Rippling connection
 *
 * @param userId - The authenticated user's ID
 * @returns Connection status
 */
export async function getRipplingConnectionStatus(
  userId: string
): Promise<RipplingConnectionStatus> {
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
 * Validate a Rippling API token by making a test API call
 *
 * @param token - The token to validate
 * @returns True if the token is valid
 */
export async function validateRipplingToken(token: string): Promise<boolean> {
  const url = `${RIPPLING_API_BASE_URL}/sso-me`;
  console.log("[Rippling] Validating token at URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log("[Rippling] Validation response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.log(
        "[Rippling] Validation error response:",
        text.substring(0, 200)
      );
    }

    return response.ok;
  } catch (err) {
    console.error("[Rippling] Validation fetch error:", err);
    return false;
  }
}

// ============================================================================
// Rippling API Client
// ============================================================================

/**
 * Rippling API client for making authenticated requests
 *
 * SECURITY: The client is initialized with a userId and only uses that user's token
 */
export class RipplingClient {
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
    this.token = await getRipplingToken(this.userId);
    if (!this.token) {
      throw new ConfigurationError(
        "Rippling is not connected. Please add your API token in Settings > Integrations."
      );
    }
  }

  /**
   * Make an authenticated request to the Rippling API
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

    const url = `${RIPPLING_API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      // Try to get error details from response body
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

      // SECURITY: Never log the token or include it in error messages
      if (response.status === 401) {
        throw new AuthenticationError(
          `Rippling API authentication failed: ${
            errorMessage || "Your token may be invalid or expired."
          }`,
          { endpoint, status: 401, details: errorDetails }
        );
      }
      if (response.status === 403) {
        throw new ExternalAPIError(
          "Rippling",
          `Access forbidden for ${endpoint}: ${
            errorMessage || "Your token may not have the required permissions."
          }`,
          403,
          { endpoint, details: errorDetails }
        );
      }
      throw new ExternalAPIError(
        "Rippling",
        `Request to ${endpoint} failed: ${
          errorMessage || `Status ${response.status}`
        }`,
        response.status,
        { endpoint, details: errorDetails }
      );
    }

    return response.json();
  }

  // ==========================================================================
  // Authentication & Profile
  // ==========================================================================

  /**
   * Get current SSO user profile info
   */
  async getMe(): Promise<unknown> {
    return this.request("/sso-me");
  }

  // ==========================================================================
  // Business Partners
  // ==========================================================================

  /**
   * Get list of business partners
   */
  async getBusinessPartners(): Promise<unknown> {
    return this.request("/business-partners");
  }

  /**
   * Get list of business partner groups
   */
  async getBusinessPartnerGroups(): Promise<unknown> {
    return this.request("/business-partner-groups");
  }

  // ==========================================================================
  // Company & Organization
  // ==========================================================================

  /**
   * Get company information
   */
  async getCompanies(): Promise<unknown> {
    return this.request("/companies");
  }

  /**
   * Get list of departments
   */
  async getDepartments(): Promise<unknown> {
    return this.request("/departments");
  }

  /**
   * Get list of teams
   */
  async getTeams(): Promise<unknown> {
    return this.request("/teams");
  }

  /**
   * Get work locations
   */
  async getWorkLocations(): Promise<unknown> {
    return this.request("/work-locations");
  }

  // ==========================================================================
  // People & Workers
  // ==========================================================================

  /**
   * Get list of users
   */
  async getUsers(): Promise<unknown> {
    return this.request("/users");
  }

  /**
   * Get list of workers
   */
  async getWorkers(): Promise<unknown> {
    return this.request("/workers");
  }

  // ==========================================================================
  // Employment Configuration
  // ==========================================================================

  /**
   * Get employment types
   */
  async getEmploymentTypes(): Promise<unknown> {
    return this.request("/employment-types");
  }

  /**
   * Get job functions
   */
  async getJobFunctions(): Promise<unknown> {
    return this.request("/job-functions");
  }

  /**
   * Get entitlements
   */
  async getEntitlements(): Promise<unknown> {
    return this.request("/entitlements");
  }

  // ==========================================================================
  // Custom Fields & Objects
  // ==========================================================================

  /**
   * Get custom fields
   */
  async getCustomFields(): Promise<unknown> {
    return this.request("/custom-fields");
  }

  /**
   * Get custom objects
   */
  async getCustomObjects(): Promise<unknown> {
    return this.request("/custom-objects");
  }

  /**
   * Get fields for a specific custom object
   */
  async getCustomObjectFields(customObjectApiName: string): Promise<unknown> {
    return this.request(`/custom-objects/${customObjectApiName}/fields`);
  }

  /**
   * Get records for a specific custom object
   */
  async getCustomObjectRecords(customObjectApiName: string): Promise<unknown> {
    return this.request(`/custom-objects/${customObjectApiName}/records`);
  }

  /**
   * Query records for a specific custom object
   */
  async queryCustomObjectRecords(
    customObjectApiName: string
  ): Promise<unknown> {
    return this.request(`/custom-objects/${customObjectApiName}/records/query`);
  }

  /**
   * Get object categories
   */
  async getObjectCategories(): Promise<unknown> {
    return this.request("/object-categories");
  }

  // ==========================================================================
  // Supergroups
  // ==========================================================================

  /**
   * Get supergroups
   */
  async getSupergroups(): Promise<unknown> {
    return this.request("/supergroups");
  }

  /**
   * Get members of a supergroup
   */
  async getSupergroupMembers(groupId: string): Promise<unknown> {
    return this.request(`/supergroups/${groupId}/members`);
  }

  /**
   * Get inclusion members of a supergroup
   */
  async getSupergroupInclusionMembers(groupId: string): Promise<unknown> {
    return this.request(`/supergroups/${groupId}/inclusion-members`);
  }

  /**
   * Get exclusion members of a supergroup
   */
  async getSupergroupExclusionMembers(groupId: string): Promise<unknown> {
    return this.request(`/supergroups/${groupId}/exclusion-members`);
  }
}

/**
 * Create an initialized Rippling client for a user
 *
 * @param userId - The authenticated user's ID
 * @returns Initialized RipplingClient
 */
export async function createRipplingClient(
  userId: string
): Promise<RipplingClient> {
  const client = new RipplingClient(userId);
  await client.initialize();
  return client;
}
