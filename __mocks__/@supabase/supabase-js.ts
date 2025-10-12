/**
 * Mock Supabase client for testing
 */

interface QueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  single: jest.Mock;
}

class MockQueryBuilder implements QueryBuilder {
  private mockData: any[] = [];
  private mockError: any = null;

  constructor(data?: any[], error?: any) {
    this.mockData = data || [];
    this.mockError = error;
  }

  select = jest.fn().mockReturnValue(this);
  insert = jest.fn().mockReturnValue(this);
  update = jest.fn().mockReturnValue(this);
  upsert = jest.fn().mockReturnValue(this);
  delete = jest.fn().mockReturnValue(this);
  eq = jest.fn().mockReturnValue(this);
  or = jest.fn().mockReturnValue(this);
  order = jest.fn().mockReturnValue(this);
  limit = jest.fn().mockImplementation(() => {
    return {
      ...this,
      then: (resolve: any) =>
        resolve({ data: this.mockData, error: this.mockError }),
    };
  });
  single = jest.fn().mockImplementation(() => {
    return {
      then: (resolve: any) =>
        resolve({
          data: this.mockData[0] || null,
          error: this.mockError,
        }),
    };
  });

  // Make it thenable for async/await
  then(resolve: any) {
    return resolve({ data: this.mockData, error: this.mockError });
  }
}

class MockSupabaseClient {
  private mockRpcResponse: any = null;
  private validKeyHashes: Set<string> = new Set();

  from(table: string) {
    // Return different mock data based on table
    if (table === "api_keys") {
      return new MockQueryBuilder([
        {
          id: "key_123",
          user_id: "user_123",
          key_hash: "test_hash",
          key_name: "Test Key",
          created_at: new Date().toISOString(),
          last_used_at: null,
          expires_at: null,
          revoked: false,
          revoked_at: null,
          metadata: {},
        },
      ]);
    }

    return new MockQueryBuilder();
  }

  rpc(functionName: string, params?: any) {
    // Mock RPC calls
    if (functionName === "validate_and_update_api_key") {
      const hashRegex = /^[a-f0-9]{64}$/i;

      // SHA256 hash of "invalid_key_for_testing" and "invalid_key_test"
      const invalidHashes = [
        "3c9909afec25354d551dae21590bb26e38d53f2173b8d3dc3eee4c047e7ab1c1", // "!!!..."
        "e7c8c52b8c8c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1c1", // any with "e7c8" pattern
      ];

      if (!params?.p_key_hash || !hashRegex.test(params.p_key_hash)) {
        return Promise.resolve({
          data: [{ user_id: null, is_valid: false }],
          error: null,
        });
      }

      // Check if it's a known invalid hash pattern
      // Hashes containing certain patterns are invalid
      if (
        params.p_key_hash.startsWith("e7c8") ||
        params.p_key_hash.startsWith("eb47") || // Hash of "sk_analytics_invalid"
        params.p_key_hash.startsWith("000") ||
        params.p_key_hash.startsWith("3c99") ||
        params.p_key_hash.startsWith("4246") || // Hash of "sk_analytics_invalid_key_for_testing"
        params.p_key_hash ===
          "4246dedefef78e676931d0c84c4670458de3096a1e3d2e87dbd5d40cd4082fa5" ||
        params.p_key_hash ===
          "eb47fe000215068a121d2c9af93c8dd597f5a44189b6837c5c7f9a383d5e6622"
      ) {
        return Promise.resolve({
          data: [{ user_id: null, is_valid: false }],
          error: null,
        });
      }

      // Otherwise, accept as valid (simulating found in DB)
      return Promise.resolve({
        data: [{ user_id: "user_123", is_valid: true }],
        error: null,
      });
    }

    if (functionName === "cleanup_expired_api_keys") {
      return Promise.resolve({
        data: 0,
        error: null,
      });
    }

    return Promise.resolve({
      data: this.mockRpcResponse,
      error: null,
    });
  }

  // Method to set mock RPC response (for testing)
  setMockRpcResponse(response: any) {
    this.mockRpcResponse = response;
  }
}

export function createClient(url: string, key: string, options?: any) {
  return new MockSupabaseClient();
}
