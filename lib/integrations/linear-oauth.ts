/**
 * Linear OAuth token management
 * Handles storing, retrieving, and refreshing Linear OAuth tokens
 */

import { supabaseAnalyticsClient } from "../analytics/supabase/client";
import {
  ConfigurationError,
  ExternalAPIError,
} from "../analytics/shared/errors";

const INTEGRATION_NAME = "linear";
const LINEAR_TOKEN_ENDPOINT = "https://api.linear.app/oauth/token";
const LINEAR_REVOKE_ENDPOINT = "https://api.linear.app/oauth/revoke";

interface LinearTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string;
}

interface LinearTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Store Linear OAuth tokens in the database
 */
export async function storeLinearTokens(
  tokenResponse: LinearTokenResponse
): Promise<void> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new ConfigurationError(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    const supabase = supabaseAnalyticsClient.getClient();

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    const tokenData = {
      integration_name: INTEGRATION_NAME,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || null,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
      expires_at: expiresAt.toISOString(),
    };

    // Upsert token (replace if exists)
    const { error } = await supabase
      .from("integration_tokens")
      .upsert(tokenData, {
        onConflict: "integration_name",
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to store Linear tokens: ${(error as Error).message}`
    );
  }
}

/**
 * Retrieve Linear OAuth tokens from the database
 * Returns null if no tokens are stored
 */
export async function getLinearTokens(): Promise<LinearTokens | null> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      return null; // Gracefully handle missing Supabase config
    }

    const supabase = supabaseAnalyticsClient.getClient();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("*")
      .eq("integration_name", INTEGRATION_NAME)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - no token stored yet
        return null;
      }
      throw new Error(`Database error: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_at: data.expires_at,
      scope: data.scope,
    };
  } catch (error) {
    console.error("Error retrieving Linear tokens:", error);
    return null;
  }
}

/**
 * Check if the current access token is expired or about to expire
 */
export function isTokenExpired(expiresAt: string): boolean {
  const expirationTime = new Date(expiresAt).getTime();
  const now = Date.now();
  // Consider token expired if it expires within the next 5 minutes
  const bufferMs = 5 * 60 * 1000;
  return expirationTime - now < bufferMs;
}

/**
 * Refresh Linear OAuth access token using refresh token
 */
export async function refreshLinearToken(): Promise<LinearTokens> {
  try {
    const currentTokens = await getLinearTokens();

    if (!currentTokens || !currentTokens.refresh_token) {
      throw new ConfigurationError(
        "No refresh token available. Re-authenticate with Linear."
      );
    }

    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ConfigurationError(
        "LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET must be set"
      );
    }

    // Exchange refresh token for new access token
    const response = await fetch(LINEAR_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: currentTokens.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalAPIError(
        "Linear",
        `Token refresh failed: ${response.status} ${errorText}`
      );
    }

    const tokenResponse: LinearTokenResponse = await response.json();

    // Store the new tokens
    await storeLinearTokens(tokenResponse);

    // Return the updated tokens
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    return {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || currentTokens.refresh_token,
      token_type: tokenResponse.token_type,
      expires_at: expiresAt.toISOString(),
      scope: tokenResponse.scope,
    };
  } catch (error) {
    if (
      error instanceof ConfigurationError ||
      error instanceof ExternalAPIError
    ) {
      throw error;
    }
    throw new ExternalAPIError(
      "Linear",
      `Failed to refresh token: ${(error as Error).message}`
    );
  }
}

/**
 * Get valid Linear access token, refreshing if necessary
 */
export async function getValidLinearToken(): Promise<string | null> {
  try {
    const tokens = await getLinearTokens();

    if (!tokens) {
      return null;
    }

    // Check if token needs refresh
    if (isTokenExpired(tokens.expires_at)) {
      const refreshedTokens = await refreshLinearToken();
      return refreshedTokens.access_token;
    }

    return tokens.access_token;
  } catch (error) {
    console.error("Error getting valid Linear token:", error);
    return null;
  }
}

/**
 * Revoke Linear OAuth token and delete from database
 */
export async function revokeLinearToken(): Promise<void> {
  try {
    const tokens = await getLinearTokens();

    if (!tokens) {
      return; // Nothing to revoke
    }

    // Revoke token with Linear
    try {
      const response = await fetch(LINEAR_REVOKE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });

      if (!response.ok && response.status !== 401) {
        // 401 means token is already invalid, which is fine
        console.warn(`Linear token revocation returned ${response.status}`);
      }
    } catch (error) {
      // Continue even if revocation fails - still delete from database
      console.error("Error revoking token with Linear:", error);
    }

    // Delete token from database
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new ConfigurationError("Supabase is not configured");
    }

    const supabase = supabaseAnalyticsClient.getClient();

    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("integration_name", INTEGRATION_NAME);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to revoke Linear token: ${(error as Error).message}`
    );
  }
}

/**
 * Check if Linear OAuth is configured and connected
 */
export async function isLinearConnected(): Promise<boolean> {
  const tokens = await getLinearTokens();
  return tokens !== null;
}
