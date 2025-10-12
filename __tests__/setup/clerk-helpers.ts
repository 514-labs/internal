/**
 * Clerk Testing Helpers
 *
 * Following Clerk best practices from:
 * https://clerk.com/docs/guides/development/testing/overview
 */

import { clerkClient } from "@clerk/nextjs/server";

interface TestUser {
  id: string;
  emailAddress: string;
  password?: string;
}

interface TestSession {
  id: string;
  userId: string;
  expiresAt: number;
}

/**
 * Create a test user via Clerk Backend API
 *
 * Per Clerk docs: Use Backend API to create users for testing
 */
export async function createTestUser(options: {
  emailAddress?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}): Promise<TestUser> {
  const client = await clerkClient();

  const email = options.emailAddress || `test-${Date.now()}@example.com`;
  const password = options.password || "TestPassword123!";

  const user = await client.users.createUser({
    emailAddress: [email],
    password,
    firstName: options.firstName || "Test",
    lastName: options.lastName || "User",
  });

  return {
    id: user.id,
    emailAddress: email,
    password,
  };
}

/**
 * Create a session for a test user
 *
 * Per Clerk docs: Create session via Backend API
 */
export async function createTestSession(userId: string): Promise<TestSession> {
  const client = await clerkClient();

  const session = await client.sessions.createSession({
    userId,
  });

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expireAt.getTime(),
  };
}

/**
 * Get a valid session token
 *
 * Per Clerk docs: Session tokens are valid for 60 seconds
 * https://clerk.com/docs/guides/development/testing/overview
 */
export async function getSessionToken(sessionId: string): Promise<string> {
  const client = await clerkClient();

  const sessionToken = await client.sessions.getToken(
    sessionId,
    "test-template"
  );

  return sessionToken.jwt;
}

/**
 * Refresh a session token
 *
 * Per Clerk docs: Tokens expire after 60 seconds, refresh before making requests
 */
export async function refreshSessionToken(sessionId: string): Promise<string> {
  return getSessionToken(sessionId);
}

/**
 * Session Token Manager
 *
 * Automatically manages Clerk session tokens with auto-refresh
 * to handle the 60-second token lifetime
 */
export class SessionTokenManager {
  private tokenCache: Map<string, { token: string; expiresAt: number }> =
    new Map();
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(autoRefresh: boolean = true) {
    if (autoRefresh) {
      this.startAutoRefresh();
    }
  }

  /**
   * Get a valid token for a session, refreshing if needed
   */
  async getToken(sessionId: string): Promise<string> {
    const cached = this.tokenCache.get(sessionId);

    // Return cached if still valid (with 10s buffer)
    if (cached && cached.expiresAt > Date.now() + 10000) {
      return cached.token;
    }

    // Refresh token
    const token = await refreshSessionToken(sessionId);
    this.tokenCache.set(sessionId, {
      token,
      expiresAt: Date.now() + 60000, // 60 seconds per Clerk docs
    });

    return token;
  }

  /**
   * Start auto-refresh interval to keep tokens fresh
   * Refreshes every 50 seconds (before 60s expiration)
   */
  private startAutoRefresh() {
    this.refreshInterval = setInterval(async () => {
      for (const [sessionId] of this.tokenCache) {
        await this.getToken(sessionId); // This will refresh
      }
    }, 50000); // 50 seconds
  }

  /**
   * Cleanup: stop auto-refresh and clear cache
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.tokenCache.clear();
  }
}

/**
 * Get Clerk Testing Token to bypass bot detection
 *
 * Per Clerk docs: Testing Tokens allow bypassing bot detection
 * https://clerk.com/docs/guides/development/testing/overview
 */
export async function getClerkTestingToken(): Promise<string> {
  const client = await clerkClient();

  // Testing tokens are instance-specific and short-lived
  // This is a mock implementation - in real tests, call Backend API
  // POST https://api.clerk.com/v1/testing_tokens

  // For now, return empty string (mock in tests)
  return "";
}

/**
 * Clean up test users after tests
 */
export async function cleanupTestUsers(userIds: string[]): Promise<void> {
  const client = await clerkClient();

  for (const userId of userIds) {
    try {
      await client.users.deleteUser(userId);
    } catch (error) {
      // Ignore errors (user might already be deleted)
      console.warn(`Failed to delete test user ${userId}:`, error);
    }
  }
}

/**
 * Create a complete test auth setup
 * Returns user, session, and token
 */
export async function setupTestAuth(options: {
  emailAddress?: string;
  isAdmin?: boolean;
}): Promise<{
  user: TestUser;
  session: TestSession;
  token: string;
}> {
  // Create user
  const user = await createTestUser({
    emailAddress: options.emailAddress,
  });

  // Set admin role if requested
  if (options.isAdmin) {
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        role: "admin",
      },
    });
  }

  // Create session
  const session = await createTestSession(user.id);

  // Get token
  const token = await getSessionToken(session.id);

  return { user, session, token };
}
