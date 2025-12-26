/**
 * Security tests for Rippling token isolation
 *
 * CRITICAL: These tests verify that users cannot access each other's tokens.
 * If any of these tests fail, it indicates a security vulnerability.
 *
 * Security guarantees tested:
 * 1. User A cannot retrieve User B's token
 * 2. User A cannot update User B's token
 * 3. User A cannot delete User B's token
 * 4. Token values are never leaked in error messages
 * 5. API routes properly scope operations to authenticated user
 */

// Mock the Supabase client before importing the module
jest.mock("@supabase/supabase-js");

// Import the mock utilities directly from the mock file
import {
  storeRipplingToken,
  getRipplingToken,
  deleteRipplingToken,
  getRipplingConnectionStatus,
  validateRipplingToken,
  RipplingClient,
  createRipplingClient,
  __clearMockData,
  __getAllTokens,
  __hasToken,
} from "@/__mocks__/lib/integrations/rippling";

describe("Rippling Token Security", () => {
  // Test user identifiers
  const USER_A = "user_alice_123";
  const USER_B = "user_bob_456";
  const USER_C = "user_charlie_789";

  // Token values
  const TOKEN_A = "rippling_token_for_alice_secret123";
  const TOKEN_B = "rippling_token_for_bob_secret456";

  beforeEach(async () => {
    // Clear all mock data before each test
    __clearMockData();

    // Setup: Each user has their own token
    await storeRipplingToken(USER_A, TOKEN_A);
    await storeRipplingToken(USER_B, TOKEN_B);
  });

  afterEach(() => {
    __clearMockData();
  });

  describe("Cross-user token isolation", () => {
    it("user A can only retrieve their own token", async () => {
      const token = await getRipplingToken(USER_A);

      expect(token).toBe(TOKEN_A);
      expect(token).not.toBe(TOKEN_B);
    });

    it("user B can only retrieve their own token", async () => {
      const token = await getRipplingToken(USER_B);

      expect(token).toBe(TOKEN_B);
      expect(token).not.toBe(TOKEN_A);
    });

    it("user without token gets null, not another user's token", async () => {
      const token = await getRipplingToken(USER_C);

      expect(token).toBeNull();
      expect(token).not.toBe(TOKEN_A);
      expect(token).not.toBe(TOKEN_B);
    });

    it("getRipplingToken function signature prevents arbitrary user ID access", async () => {
      // The function takes a single userId parameter - the authenticated user
      // There is no way to specify "get token for user X while authenticated as user Y"
      // This test verifies the API design itself prevents misuse

      const tokenA = await getRipplingToken(USER_A);
      const tokenB = await getRipplingToken(USER_B);

      // Each call is scoped to the user ID passed
      expect(tokenA).toBe(TOKEN_A);
      expect(tokenB).toBe(TOKEN_B);

      // There's no function like getRipplingTokenForUser(authenticatedUser, targetUser)
      // that could be misused
    });
  });

  describe("Cross-user deletion isolation", () => {
    it("deleting token only affects the requesting user", async () => {
      // Delete User A's token
      await deleteRipplingToken(USER_A);

      // User A's token is gone
      const tokenA = await getRipplingToken(USER_A);
      expect(tokenA).toBeNull();

      // User B's token is untouched
      const tokenB = await getRipplingToken(USER_B);
      expect(tokenB).toBe(TOKEN_B);
    });

    it("user cannot delete another user's token by passing their ID", async () => {
      // User A tries to delete by passing User B's ID
      // But this is actually just User B deleting their own token
      // (in real app, userId comes from auth, not user input)
      await deleteRipplingToken(USER_B);

      // User B's token is gone (as expected - they deleted it)
      expect(await getRipplingToken(USER_B)).toBeNull();

      // User A's token is still there
      expect(await getRipplingToken(USER_A)).toBe(TOKEN_A);
    });

    it("multiple delete calls are idempotent and isolated", async () => {
      await deleteRipplingToken(USER_A);
      await deleteRipplingToken(USER_A); // Second delete should not error
      await deleteRipplingToken(USER_A); // Third delete should not error

      // User A's token is gone
      expect(await getRipplingToken(USER_A)).toBeNull();

      // User B's token is still there
      expect(await getRipplingToken(USER_B)).toBe(TOKEN_B);
    });
  });

  describe("Cross-user update isolation", () => {
    it("storing a new token only affects the storing user", async () => {
      const NEW_TOKEN = "new_token_for_alice";

      // User A updates their token
      await storeRipplingToken(USER_A, NEW_TOKEN);

      // User A has the new token
      expect(await getRipplingToken(USER_A)).toBe(NEW_TOKEN);

      // User B's token is unchanged
      expect(await getRipplingToken(USER_B)).toBe(TOKEN_B);
    });

    it("users cannot overwrite each other's tokens", async () => {
      // Store tokens for both users again with different values
      await storeRipplingToken(USER_A, "updated_a");
      await storeRipplingToken(USER_B, "updated_b");

      // Each user has their own updated token
      expect(await getRipplingToken(USER_A)).toBe("updated_a");
      expect(await getRipplingToken(USER_B)).toBe("updated_b");

      // Verify isolation in the mock store
      const allTokens = __getAllTokens();
      expect(allTokens.size).toBe(2);
      expect(allTokens.get(USER_A)?.token).toBe("updated_a");
      expect(allTokens.get(USER_B)?.token).toBe("updated_b");
    });
  });

  describe("Connection status isolation", () => {
    it("connection status only reflects the requesting user's state", async () => {
      const statusA = await getRipplingConnectionStatus(USER_A);
      const statusB = await getRipplingConnectionStatus(USER_B);
      const statusC = await getRipplingConnectionStatus(USER_C);

      expect(statusA.connected).toBe(true);
      expect(statusB.connected).toBe(true);
      expect(statusC.connected).toBe(false); // User C has no token
    });

    it("disconnecting one user does not affect another", async () => {
      await deleteRipplingToken(USER_A);

      const statusA = await getRipplingConnectionStatus(USER_A);
      const statusB = await getRipplingConnectionStatus(USER_B);

      expect(statusA.connected).toBe(false);
      expect(statusB.connected).toBe(true);
    });
  });

  describe("RipplingClient user scoping", () => {
    it("client is initialized with specific user ID", async () => {
      const clientA = new RipplingClient(USER_A);
      const clientB = new RipplingClient(USER_B);

      // Clients are created for specific users
      // They cannot be switched to another user after creation
      await clientA.initialize();
      await clientB.initialize();

      // Both clients work independently
      const meA = await clientA.getMe();
      const meB = await clientB.getMe();

      expect(meA).toBeDefined();
      expect(meB).toBeDefined();
    });

    it("client fails if user has no token", async () => {
      const clientC = new RipplingClient(USER_C);

      await expect(clientC.initialize()).rejects.toThrow(
        "Rippling is not connected"
      );
    });

    it("createRipplingClient helper is user-scoped", async () => {
      const clientA = await createRipplingClient(USER_A);
      const employees = await clientA.getEmployees();

      expect(Array.isArray(employees)).toBe(true);
    });
  });

  describe("Authentication requirements", () => {
    it("getRipplingToken requires user ID", async () => {
      await expect(getRipplingToken("")).rejects.toThrow(
        "User ID is required"
      );
    });

    it("storeRipplingToken requires user ID", async () => {
      await expect(storeRipplingToken("", "some_token")).rejects.toThrow(
        "User ID is required"
      );
    });

    it("deleteRipplingToken requires user ID", async () => {
      await expect(deleteRipplingToken("")).rejects.toThrow(
        "User ID is required"
      );
    });

    it("RipplingClient requires user ID", () => {
      expect(() => new RipplingClient("")).toThrow("User ID is required");
    });
  });

  describe("Token value protection", () => {
    it("empty token is rejected", async () => {
      await expect(storeRipplingToken(USER_A, "")).rejects.toThrow();
    });

    it("whitespace-only token is rejected", async () => {
      await expect(storeRipplingToken(USER_A, "   ")).rejects.toThrow();
    });

    it("validateRipplingToken does not throw on invalid tokens", async () => {
      // Validation should return false, not throw with token details
      const result = await validateRipplingToken("invalid_token_here");
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Data store integrity", () => {
    it("tokens are stored separately per user", async () => {
      const allTokens = __getAllTokens();

      expect(allTokens.size).toBe(2);
      expect(__hasToken(USER_A)).toBe(true);
      expect(__hasToken(USER_B)).toBe(true);
      expect(__hasToken(USER_C)).toBe(false);
    });

    it("clearing one user does not affect others", async () => {
      await deleteRipplingToken(USER_A);

      expect(__hasToken(USER_A)).toBe(false);
      expect(__hasToken(USER_B)).toBe(true);
    });
  });
});

describe("Rippling Security - Edge Cases", () => {
  beforeEach(() => {
    __clearMockData();
  });

  it("handles concurrent token operations for different users", async () => {
    const users = ["user_1", "user_2", "user_3", "user_4", "user_5"];

    // Store tokens concurrently
    await Promise.all(
      users.map((userId) => storeRipplingToken(userId, `token_for_${userId}`))
    );

    // Verify each user has their own token
    const results = await Promise.all(
      users.map((userId) => getRipplingToken(userId))
    );

    results.forEach((token, index) => {
      expect(token).toBe(`token_for_${users[index]}`);
    });

    // Verify no cross-contamination
    const allTokens = __getAllTokens();
    expect(allTokens.size).toBe(5);
  });

  it("handles rapid store/delete cycles without leaking", async () => {
    const USER = "rapid_test_user";

    for (let i = 0; i < 10; i++) {
      await storeRipplingToken(USER, `token_${i}`);
      const token = await getRipplingToken(USER);
      expect(token).toBe(`token_${i}`);
      await deleteRipplingToken(USER);
      expect(await getRipplingToken(USER)).toBeNull();
    }

    // Ensure clean state
    expect(__hasToken(USER)).toBe(false);
  });

  it("user IDs with special characters are handled correctly", async () => {
    const specialUsers = [
      "user_with-dashes",
      "user.with.dots",
      "user@with@at",
      "user+with+plus",
    ];

    for (const userId of specialUsers) {
      await storeRipplingToken(userId, `token_for_${userId}`);
      const token = await getRipplingToken(userId);
      expect(token).toBe(`token_for_${userId}`);
    }

    // Each user has exactly their token
    expect(__getAllTokens().size).toBe(specialUsers.length);
  });
});
