/**
 * API key generation and validation using Supabase
 *
 * API keys are securely stored in Supabase database (NOT in Clerk metadata)
 * and used to authenticate requests to the analytics API endpoints.
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import {
  AuthenticationError,
  AuthorizationError,
} from "../analytics/shared/errors";
import { supabaseAnalyticsClient } from "../analytics/supabase/client";
import * as crypto from "crypto";

const API_KEY_PREFIX = "sk_analytics_";

interface ApiKeyRecord {
  id: string;
  user_id: string;
  key_hash: string;
  key_name: string | null;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked: boolean;
  revoked_at: string | null;
  metadata: Record<string, unknown>;
}

/**
 * Generate a new API key for a user
 * API keys are stored securely in Supabase database
 */
export async function generateApiKey(
  userId: string,
  keyName?: string
): Promise<string> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new Error(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    const supabase = supabaseAnalyticsClient.getClient();

    // Generate a secure random API key
    const randomBytes = crypto.randomBytes(32);
    const apiKey = `${API_KEY_PREFIX}${randomBytes.toString("base64url")}`;

    // Hash the API key for storage
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Store hashed key in Supabase
    const { error } = await supabase.from("api_keys").insert({
      user_id: userId,
      key_hash: hashedKey,
      key_name: keyName || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Return the plain API key (only time it's shown to user)
    return apiKey;
  } catch (error) {
    throw new Error(`Failed to generate API key: ${(error as Error).message}`);
  }
}

/**
 * Validate an API key and return the associated user ID
 */
export async function validateApiKey(apiKey: string): Promise<string> {
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    throw new AuthenticationError("Invalid API key format");
  }

  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new Error(
        "Supabase is not configured. API key validation requires Supabase."
      );
    }

    const supabase = supabaseAnalyticsClient.getClient();

    // Hash the provided API key
    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    // Use the database function to validate and update last_used_at atomically
    const { data, error } = await supabase.rpc("validate_and_update_api_key", {
      p_key_hash: hashedKey,
    });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Check if we got a valid result
    if (!data || data.length === 0 || !data[0].is_valid || !data[0].user_id) {
      throw new AuthenticationError("Invalid or expired API key");
    }

    return data[0].user_id;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError(
      `API key validation failed: ${(error as Error).message}`
    );
  }
}

/**
 * Revoke an API key by its ID
 */
export async function revokeApiKey(
  userId: string,
  apiKeyId: string
): Promise<void> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const supabase = supabaseAnalyticsClient.getClient();

    const { error } = await supabase
      .from("api_keys")
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
      })
      .eq("id", apiKeyId)
      .eq("user_id", userId); // Ensure user can only revoke their own keys

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`Failed to revoke API key: ${(error as Error).message}`);
  }
}

/**
 * List all API keys for a user (returns metadata, not actual keys)
 */
export async function listApiKeys(userId: string): Promise<ApiKeyRecord[]> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new Error("Supabase is not configured.");
    }

    const supabase = supabaseAnalyticsClient.getClient();

    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return (data || []) as ApiKeyRecord[];
  } catch (error) {
    throw new Error(`Failed to list API keys: ${(error as Error).message}`);
  }
}

/**
 * Middleware helper to protect API routes with API key authentication
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const userId = await withApiKeyAuth(request);
 *   // ... handle request
 * }
 */
export async function withApiKeyAuth(request: NextRequest): Promise<string> {
  // Check for API key in Authorization header
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    // Fallback to checking if user is signed in with Clerk
    const { userId } = await auth();
    if (userId) {
      return userId;
    }

    throw new AuthenticationError(
      "No authentication provided. Include API key in Authorization header or sign in."
    );
  }

  // Parse Bearer token
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) {
    throw new AuthenticationError(
      "Invalid Authorization header format. Use: Bearer <api_key>"
    );
  }

  const apiKey = match[1];
  return await validateApiKey(apiKey);
}

/**
 * Check if user has admin permissions via organization membership
 */
export async function requireAdmin(userId: string): Promise<void> {
  const client = await clerkClient();

  // Get user's organization memberships
  const { data: memberships } =
    await client.users.getOrganizationMembershipList({
      userId,
    });

  // Check if user is an admin in any organization
  const isAdmin = memberships.some(
    (membership) => membership.role === "org:admin"
  );

  if (!isAdmin) {
    throw new AuthorizationError(
      "Admin access required. You must be an admin in an organization to manage integrations."
    );
  }
}
