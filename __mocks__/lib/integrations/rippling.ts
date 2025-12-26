/**
 * Mock Rippling integration for testing
 *
 * SECURITY TESTING:
 * This mock is designed to help verify that token isolation works correctly.
 * It stores tokens per-user and allows testing cross-user access attempts.
 */

import { AuthenticationError } from "@/lib/analytics/shared/errors";

// In-memory store of user tokens (simulates database)
const mockUserTokens: Map<string, { token: string; createdAt: string }> =
  new Map();

// Track API calls for verification
const apiCallLog: Array<{
  userId: string;
  method: string;
  endpoint: string;
  timestamp: Date;
}> = [];

/**
 * Mock: Store a Rippling API token for a user
 */
export async function storeRipplingToken(
  userId: string,
  token: string
): Promise<void> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to store token");
  }

  if (!token || token.trim() === "") {
    throw new Error("Token cannot be empty");
  }

  mockUserTokens.set(userId, {
    token,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Mock: Get a user's Rippling token
 *
 * SECURITY: Only returns the token for the requesting user
 */
export async function getRipplingToken(userId: string): Promise<string | null> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to retrieve token");
  }

  const record = mockUserTokens.get(userId);
  return record?.token ?? null;
}

/**
 * Mock: Delete a user's Rippling token
 *
 * SECURITY: Only deletes the requesting user's token
 */
export async function deleteRipplingToken(userId: string): Promise<void> {
  if (!userId) {
    throw new AuthenticationError("User ID is required to delete token");
  }

  mockUserTokens.delete(userId);
}

/**
 * Mock: Get connection status for a user
 */
export async function getRipplingConnectionStatus(userId: string): Promise<{
  connected: boolean;
  createdAt?: string;
  message?: string;
}> {
  if (!userId) {
    return { connected: false, message: "Not authenticated" };
  }

  const record = mockUserTokens.get(userId);

  if (!record) {
    return { connected: false };
  }

  return {
    connected: true,
    createdAt: record.createdAt,
  };
}

/**
 * Mock: Validate a token
 */
export async function validateRipplingToken(token: string): Promise<boolean> {
  // For testing, consider any non-empty token valid unless it contains "invalid"
  return token.length > 0 && !token.includes("invalid");
}

/**
 * Mock Rippling API Client
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

  async initialize(): Promise<void> {
    this.token = await getRipplingToken(this.userId);
    if (!this.token) {
      throw new Error("Rippling is not connected");
    }
  }

  private logCall(method: string, endpoint: string): void {
    apiCallLog.push({
      userId: this.userId,
      method,
      endpoint,
      timestamp: new Date(),
    });
  }

  async getMe(): Promise<unknown> {
    this.logCall("GET", "/platform/api/me");
    return { id: "mock-user", name: "Test User" };
  }

  async getEmployees(): Promise<unknown[]> {
    this.logCall("GET", "/platform/api/employees");
    return [
      { id: "emp-1", firstName: "John", lastName: "Doe", email: "john@example.com" },
      { id: "emp-2", firstName: "Jane", lastName: "Smith", email: "jane@example.com" },
    ];
  }

  async getEmployee(employeeId: string): Promise<unknown> {
    this.logCall("GET", `/platform/api/employees/${employeeId}`);
    return { id: employeeId, firstName: "John", lastName: "Doe" };
  }

  async getTeams(): Promise<unknown[]> {
    this.logCall("GET", "/platform/api/teams");
    return [{ id: "team-1", name: "Engineering" }];
  }

  async getDepartments(): Promise<unknown[]> {
    this.logCall("GET", "/platform/api/departments");
    return [{ id: "dept-1", name: "Product" }];
  }

  async getCompany(): Promise<unknown> {
    this.logCall("GET", "/platform/api/companies");
    return { id: "company-1", name: "Test Company" };
  }

  async getCustomFields(): Promise<unknown> {
    this.logCall("GET", "/platform/api/custom_fields");
    return [];
  }

  async getGroups(): Promise<unknown> {
    this.logCall("GET", "/platform/api/groups");
    return [];
  }

  async getWorkLocations(): Promise<unknown> {
    this.logCall("GET", "/platform/api/work_locations");
    return [];
  }

  async getEmploymentTypes(): Promise<unknown> {
    this.logCall("GET", "/platform/api/employment_types");
    return [];
  }

  async getLevels(): Promise<unknown> {
    this.logCall("GET", "/platform/api/levels");
    return [];
  }
}

/**
 * Create an initialized Rippling client
 */
export async function createRipplingClient(
  userId: string
): Promise<RipplingClient> {
  const client = new RipplingClient(userId);
  await client.initialize();
  return client;
}

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Clear all mock data - call in beforeEach/afterEach
 */
export function __clearMockData(): void {
  mockUserTokens.clear();
  apiCallLog.length = 0;
}

/**
 * Get all stored tokens (for test assertions)
 */
export function __getAllTokens(): Map<string, { token: string; createdAt: string }> {
  return new Map(mockUserTokens);
}

/**
 * Get API call log (for test assertions)
 */
export function __getApiCallLog(): typeof apiCallLog {
  return [...apiCallLog];
}

/**
 * Check if a specific user has a token stored
 */
export function __hasToken(userId: string): boolean {
  return mockUserTokens.has(userId);
}

