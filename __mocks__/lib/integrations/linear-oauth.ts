/**
 * Mock Linear OAuth token management for testing
 */

let mockTokens: {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string;
} | null = null;

let mockRefreshCount = 0;

/**
 * Mock: Get valid Linear token (with auto-refresh)
 */
export async function getValidLinearToken(): Promise<string | null> {
  if (!mockTokens) {
    return null; // No OAuth configured, will fall back to API key
  }

  // Check if token is expired (with 5min buffer)
  const expiresAt = new Date(mockTokens.expires_at).getTime();
  const now = Date.now();
  const buffer = 5 * 60 * 1000; // 5 minutes

  if (expiresAt - buffer < now) {
    // Token needs refresh
    await refreshLinearToken();
  }

  return mockTokens.access_token;
}

/**
 * Mock: Store Linear tokens
 */
export async function storeLinearTokens(tokenResponse: {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}): Promise<void> {
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

  mockTokens = {
    access_token: tokenResponse.access_token,
    refresh_token: tokenResponse.refresh_token || "",
    token_type: tokenResponse.token_type,
    expires_at: expiresAt.toISOString(),
    scope: tokenResponse.scope,
  };
}

/**
 * Mock: Refresh Linear token
 */
export async function refreshLinearToken(): Promise<void> {
  if (!mockTokens || !mockTokens.refresh_token) {
    throw new Error("No refresh token available");
  }

  mockRefreshCount++;

  // Simulate token refresh
  mockTokens = {
    ...mockTokens,
    access_token: `mock_refreshed_token_${mockRefreshCount}`,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
  };
}

/**
 * Mock: Revoke Linear token
 */
export async function revokeLinearToken(): Promise<void> {
  mockTokens = null;
}

/**
 * Mock: Check if Linear is connected via OAuth
 */
export async function isLinearConnected(): Promise<boolean> {
  return mockTokens !== null;
}

/**
 * Mock: Get Linear tokens (without validation/refresh)
 */
export async function getLinearTokens() {
  return mockTokens;
}

// Test utilities
export function __setMockTokens(tokens: typeof mockTokens) {
  mockTokens = tokens;
}

export function __clearMockTokens() {
  mockTokens = null;
  mockRefreshCount = 0;
}

export function __getMockRefreshCount() {
  return mockRefreshCount;
}
