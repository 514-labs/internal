/**
 * Enhanced Supabase mock for testing with in-memory database
 * This provides realistic database behavior for tests
 */

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

interface LinearTokenRecord {
  integration_name: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

// In-memory storage for testing
const inMemoryDb: {
  api_keys: ApiKeyRecord[];
  integration_tokens: LinearTokenRecord[];
} = {
  api_keys: [],
  integration_tokens: [],
};

let nextKeyId = 1;

class IntegrationQueryBuilder {
  private table: string;
  private filterChain: {
    column?: string;
    value?: any;
    operator?: string;
  }[] = [];
  private selectedColumns = "*";
  private orderConfig: { column: string; ascending: boolean } | null = null;
  private limitValue: number | null = null;
  private updateData: any = null;
  private insertData: any = null;
  private upsertData: any = null;
  private shouldDelete = false;

  constructor(table: string) {
    this.table = table;
  }

  select = jest.fn((columns: string = "*") => {
    this.selectedColumns = columns;
    return this;
  });

  insert = jest.fn((data: any) => {
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  });

  upsert = jest.fn((data: any) => {
    this.upsertData = Array.isArray(data) ? data : [data];
    return this;
  });

  update = jest.fn((data: any) => {
    this.updateData = data;
    return this;
  });

  delete = jest.fn(() => {
    this.shouldDelete = true;
    return this;
  });

  eq = jest.fn((column: string, value: any) => {
    this.filterChain.push({ column, value, operator: "eq" });
    return this;
  });

  or = jest.fn((conditions: string) => {
    // Parse OR conditions like "user_id.like.test_%,user_id.like.user_test%"
    this.filterChain.push({ operator: "or", value: conditions });
    return this;
  });

  order = jest.fn((column: string, options?: { ascending?: boolean }) => {
    this.orderConfig = { column, ascending: options?.ascending ?? true };
    return this;
  });

  limit = jest.fn((count: number) => {
    this.limitValue = count;
    return this;
  });

  single = jest.fn(() => {
    return this.executeQuery(true);
  });

  // Make it thenable for async/await
  then(resolve: any, reject?: any) {
    return this.executeQuery().then(resolve, reject);
  }

  private async executeQuery(single = false): Promise<any> {
    if (this.table === "api_keys") {
      // Handle INSERT
      if (this.insertData) {
        const newRecords: ApiKeyRecord[] = this.insertData.map((data: any) => ({
          id: `key_${nextKeyId++}`,
          user_id: data.user_id,
          key_hash: data.key_hash,
          key_name: data.key_name || null,
          created_at: data.created_at || new Date().toISOString(),
          last_used_at: null,
          expires_at: data.expires_at || null,
          revoked: data.revoked || false,
          revoked_at: null,
          metadata: data.metadata || {},
        }));

        inMemoryDb.api_keys.push(...newRecords);

        return {
          data: single ? newRecords[0] : newRecords,
          error: null,
        };
      }

      // Handle UPDATE
      if (this.updateData) {
        let updated = 0;
        inMemoryDb.api_keys = inMemoryDb.api_keys.map((record) => {
          if (this.matchesFilters(record)) {
            updated++;
            return { ...record, ...this.updateData };
          }
          return record;
        });

        return {
          data: null,
          error: null,
          count: updated,
        };
      }

      // Handle DELETE
      if (this.shouldDelete) {
        const beforeCount = inMemoryDb.api_keys.length;
        inMemoryDb.api_keys = inMemoryDb.api_keys.filter(
          (record) => !this.matchesFilters(record)
        );
        const deleted = beforeCount - inMemoryDb.api_keys.length;

        return {
          data: null,
          error: null,
          count: deleted,
        };
      }

      // Handle SELECT
      let results = inMemoryDb.api_keys.filter((record) =>
        this.matchesFilters(record)
      );

      // Apply ordering
      if (this.orderConfig) {
        results.sort((a: any, b: any) => {
          const aVal = a[this.orderConfig!.column];
          const bVal = b[this.orderConfig!.column];
          const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
          return this.orderConfig!.ascending ? comparison : -comparison;
        });
      }

      // Apply limit
      if (this.limitValue) {
        results = results.slice(0, this.limitValue);
      }

      return {
        data: single ? results[0] || null : results,
        error: null,
      };
    }

    if (this.table === "integration_tokens") {
      // Handle UPSERT for Linear OAuth tokens
      if (this.upsertData) {
        const data = this.upsertData[0];
        // Use integration_name as the conflict key
        const existingIndex = inMemoryDb.integration_tokens.findIndex(
          (t) => t.integration_name === data.integration_name
        );

        const tokenRecord: LinearTokenRecord = {
          integration_name: data.integration_name || "linear",
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
          scope: data.scope || "read,write",
          token_type: data.token_type || "Bearer",
          created_at: data.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (existingIndex >= 0) {
          inMemoryDb.integration_tokens[existingIndex] = tokenRecord;
        } else {
          inMemoryDb.integration_tokens.push(tokenRecord);
        }

        return {
          data: [tokenRecord],
          error: null,
        };
      }

      // Handle DELETE
      if (this.shouldDelete) {
        const beforeCount = inMemoryDb.integration_tokens.length;
        inMemoryDb.integration_tokens = inMemoryDb.integration_tokens.filter(
          (record) => !this.matchesFilters(record)
        );
        const deleted = beforeCount - inMemoryDb.integration_tokens.length;

        return {
          data: null,
          error: null,
          count: deleted,
        };
      }

      // Handle SELECT
      let results = inMemoryDb.integration_tokens.filter((record) =>
        this.matchesFilters(record)
      );

      return {
        data: single ? results[0] || null : results,
        error: null,
      };
    }

    return { data: null, error: null };
  }

  private matchesFilters(record: any): boolean {
    for (const filter of this.filterChain) {
      if (filter.operator === "eq") {
        if (record[filter.column!] !== filter.value) {
          return false;
        }
      } else if (filter.operator === "or") {
        // Parse OR conditions
        const conditions = filter.value.split(",");
        let matches = false;
        for (const condition of conditions) {
          // Parse "user_id.like.test_%"
          const parts = condition.split(".");
          if (parts.length === 3 && parts[1] === "like") {
            const column = parts[0];
            const pattern = parts[2].replace(/%/g, ".*").replace(/_/g, ".");
            const regex = new RegExp(`^${pattern}$`);
            if (regex.test(record[column])) {
              matches = true;
              break;
            }
          }
        }
        if (!matches) {
          return false;
        }
      }
    }
    return true;
  }
}

class IntegrationSupabaseClient {
  from(table: string) {
    return new IntegrationQueryBuilder(table);
  }

  rpc(functionName: string, params?: any) {
    if (functionName === "validate_and_update_api_key") {
      const keyHash = params?.p_key_hash;
      if (!keyHash) {
        return Promise.resolve({
          data: [{ user_id: null, is_valid: false }],
          error: null,
        });
      }

      // Find the key in our in-memory DB
      const keyRecord = inMemoryDb.api_keys.find(
        (k) => k.key_hash === keyHash && !k.revoked
      );

      if (!keyRecord) {
        return Promise.resolve({
          data: [{ user_id: null, is_valid: false }],
          error: null,
        });
      }

      // Update last_used_at
      keyRecord.last_used_at = new Date().toISOString();

      return Promise.resolve({
        data: [{ user_id: keyRecord.user_id, is_valid: true }],
        error: null,
      });
    }

    if (functionName === "cleanup_expired_api_keys") {
      return Promise.resolve({
        data: 0,
        error: null,
      });
    }

    return Promise.resolve({ data: null, error: null });
  }
}

export function createClient(url: string, key: string, options?: any) {
  return new IntegrationSupabaseClient();
}

// Export helper to reset DB state between tests
export function resetInMemoryDb() {
  inMemoryDb.api_keys = [];
  inMemoryDb.integration_tokens = [];
  nextKeyId = 1;
}

export function getInMemoryDb() {
  return inMemoryDb;
}
