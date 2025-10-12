# Integration Testing Guide

## Overview

This document explains the integration testing approach for the analytics API, which tests the full stack including:
- **Clerk authentication** (using Clerk's testing approach)
- **API key management** (create, validate, revoke in database)
- **Supabase database operations** (full CRUD lifecycle)
- **API route authentication** (end-to-end request flow)

## Architecture

### Test Layers

1. **Unit Tests** (`__tests__/analytics/unit/`)
   - Test individual functions in isolation
   - Use mocks for all external dependencies
   - Fast, no external services required

2. **Integration Tests** (`__tests__/analytics/integration/`)
   - Test full integration between components
  - Test API routes with authentication
  - Test database operations (create, read, update, delete)
  - Use mocks for external APIs (PostHog, Linear)
  - **Require real Supabase database** (can use test instance)

3. **E2E Tests** (`__tests__/analytics/integration/e2e/`)
   - Test complete user flows
   - Test full API key lifecycle with database
   - Demonstrate Clerk testing approach
   - Validate database constraints and security

## Integration Test Pattern

### Full Database Lifecycle Testing

All integration tests now follow this pattern:

```typescript
describe("My Integration Test", () => {
  const testUserId = "test_user_" + Date.now();
  let apiKeyIds: string[] = [];

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    // Create fresh API key for EACH test
    testApiKey = await generateApiKey(testUserId, "Test Key");
    
    // Track key for cleanup
    const keys = await listApiKeys(testUserId);
    const newKey = keys.find((k) => k.key_name === "Test Key");
    if (newKey) {
      apiKeyIds.push(newKey.id);
    }
  });

  afterEach(async () => {
    // Revoke keys created in this test
    for (const keyId of apiKeyIds) {
      await revokeApiKey(testUserId, keyId);
    }
    apiKeyIds = [];
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupUserApiKeys(testUserId);
    await cleanupTestDatabase();
  });

  it("should do something", async () => {
    // Test uses testApiKey which is fresh per test
    // Test can also create additional keys
    // All keys are cleaned up automatically
  });
});
```

### Why This Pattern?

1. **Isolation**: Each test gets fresh API keys
2. **Cleanup**: Keys are always revoked/deleted after tests
3. **Real DB Operations**: Tests actually write to and read from database
4. **Tracks State**: Tests verify database state changes
5. **Concurrency Safe**: Unique user IDs prevent test interference

## Clerk Testing Approach

### Per Clerk Documentation

Following [Clerk's testing best practices](https://clerk.com/docs/guides/development/testing/overview):

1. **Test Users**: Create test users via Clerk Backend API
2. **Test Sessions**: Generate sessions for test users
3. **Testing Tokens**: Use Clerk's testing tokens to bypass bot detection
4. **Test Keys**: Use unique test user IDs for isolation

### Implementation

Our tests leverage Clerk's testing utilities:

```typescript
import {
  createTestUser,
  createTestSession,
  getSessionToken,
  cleanupTestUsers,
} from "../../../setup/clerk-helpers";

// Create test user (real or mocked based on environment)
const { user, session, token } = await setupTestAuth({
  emailAddress: "test@example.com",
  isAdmin: true,
});

// Use session token for authenticated requests
request.headers.set("Authorization", `Bearer ${token}`);
```

### Test User IDs

We use a specific format for test user IDs:
```typescript
const testUserId = "test_user_{service}_{timestamp}";
// Examples:
// - "test_user_linear_1234567890"
// - "test_user_posthog_1234567890"
// - "test_user_e2e_1234567890"
```

This allows:
- Easy identification of test data
- Bulk cleanup with pattern matching
- Unique IDs per test run (timestamp)

## Database Operations

### What Gets Tested

Integration tests verify the complete database lifecycle:

1. **Create** - `generateApiKey()` writes to `api_keys` table
   ```typescript
   const apiKey = await generateApiKey(userId, "My Key");
   
   // Verify in DB
   const keys = await listApiKeys(userId);
   expect(keys).toHaveLength(1);
   expect(keys[0].user_id).toBe(userId);
   ```

2. **Read** - `listApiKeys()` reads from database
   ```typescript
   const keys = await listApiKeys(userId);
   expect(keys[0].key_name).toBe("My Key");
   expect(keys[0].revoked).toBe(false);
   ```

3. **Update** - `validateApiKey()` updates `last_used_at`
   ```typescript
   await validateApiKey(apiKey);
   
   // Verify last_used_at was updated
   const keys = await listApiKeys(userId);
   expect(keys[0].last_used_at).not.toBeNull();
   ```

4. **Revoke** - `revokeApiKey()` sets `revoked` flag
   ```typescript
   await revokeApiKey(userId, keyId);
   
   // Verify in DB
   const keys = await listApiKeys(userId);
   expect(keys[0].revoked).toBe(true);
   expect(keys[0].revoked_at).not.toBeNull();
   ```

5. **Delete** - `cleanupUserApiKeys()` deletes records
   ```typescript
   await cleanupUserApiKeys(userId);
   
   // Verify deletion
   const keys = await listApiKeys(userId);
   expect(keys).toHaveLength(0);
   ```

### Database Constraints Tested

Tests verify database enforces security:

```typescript
// User A cannot revoke User B's keys
await revokeApiKey(userBId, userAKeyId);
// Key remains active (DB constraint)

// Key hashes are stored, not plaintext
const keys = await listApiKeys(userId);
expect(keys[0].key_hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256
expect(keys[0].key_hash).not.toBe(apiKey); // Not plaintext
```

## Running Integration Tests

### Prerequisites

Integration tests require:

1. **Supabase Database** (test instance recommended)
   ```bash
   # Set in .env.local
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Clerk Test Environment** (optional, can use mocks)
   ```bash
   CLERK_SECRET_KEY=your_test_secret_key
   ```

3. **External API Keys** (optional, tests use mocks if not provided)
   ```bash
   POSTHOG_API_KEY=phc_test_key
   LINEAR_CLIENT_ID=test_client_id
   ```

### Running Tests

```bash
# Run all integration tests
pnpm test __tests__/analytics/integration

# Run specific integration test suite
pnpm test __tests__/analytics/integration/api-routes/linear.test.ts

# Run E2E tests
pnpm test __tests__/analytics/integration/e2e

# Run with real APIs (requires all env vars)
SKIP_MOCKS=true pnpm test __tests__/analytics/integration
```

### With Mocks vs Real Services

| Component | With Mocks | With Real Services |
|-----------|------------|-------------------|
| Supabase DB | ⚠️ Limited (static mock) | ✅ Full CRUD operations |
| Clerk Auth | ✅ Mocked users/sessions | ✅ Real Clerk API |
| PostHog API | ✅ Mocked responses | ✅ Real PostHog data |
| Linear API | ✅ Mocked responses | ✅ Real Linear data |

**Recommendation**: Use real Supabase test database for integration tests, mock external APIs.

## Test Files

### Integration Tests

- **`api-routes/linear.test.ts`** - Linear API routes with full DB lifecycle
- **`api-routes/posthog.test.ts`** - PostHog API routes with full DB lifecycle
- **`api-routes/linear-oauth.test.ts`** - OAuth flow with token storage in DB

### E2E Tests

- **`e2e/api-key-flow.test.ts`** - Complete API key lifecycle (create → use → revoke → delete)
- **`e2e/clerk-api-key-integration.test.ts`** - Comprehensive Clerk + DB integration showcase
- **`e2e/auth-middleware.test.ts`** - Authentication middleware testing
- **`e2e/linear-oauth-flow.test.ts`** - Full OAuth flow end-to-end

## Key Testing Utilities

### Test Helpers (`__tests__/setup/test-helpers.ts`)

```typescript
// Database setup/cleanup
await setupTestDatabase()
await cleanupTestDatabase()
await cleanupUserApiKeys(userId)

// Create test data directly in DB
const keyId = await createTestApiKey({
  userId: "test_123",
  keyHash: "...",
  keyName: "Test Key"
})
```

### Clerk Helpers (`__tests__/setup/clerk-helpers.ts`)

```typescript
// Create test user
const user = await createTestUser({
  emailAddress: "test@example.com"
})

// Create session
const session = await createTestSession(user.id)

// Get session token
const token = await getSessionToken(session.id)

// Complete setup
const { user, session, token } = await setupTestAuth({
  isAdmin: true
})

// Cleanup
await cleanupTestUsers([user.id])
```

## Best Practices

### ✅ DO

- Create fresh API keys per test (in `beforeEach`)
- Clean up keys after each test (in `afterEach`)
- Use unique test user IDs with timestamps
- Verify database state after operations
- Test database constraints and security
- Test the complete lifecycle (create → use → revoke → delete)

### ❌ DON'T

- Reuse API keys across tests
- Assume database state from previous tests
- Use hardcoded user IDs (use timestamps for uniqueness)
- Skip cleanup (causes test pollution)
- Mock the Supabase client for integration tests (defeats the purpose)

## Troubleshooting

### Tests Fail with "Supabase not configured"

```bash
# Set environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your_key"

# Or create .env.local
echo "SUPABASE_URL=https://your-project.supabase.co" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=your_key" >> .env.local
```

### Tests Leave Data in Database

```bash
# Run cleanup manually
pnpm test:cleanup

# Or use the cleanup utility
node scripts/cleanup-test-data.js
```

### Mocks Return Static Data

Integration tests with mocks have limitations:
- Use real Supabase for true integration testing
- Mocks are useful for API route structure testing
- E2E tests demonstrate expected behavior even with mocks

## Example: Complete Integration Test

See `__tests__/analytics/integration/e2e/clerk-api-key-integration.test.ts` for a comprehensive example that demonstrates:

1. ✅ Creating API keys in database
2. ✅ Validating keys and tracking usage
3. ✅ Revoking keys in database
4. ✅ Deleting keys from database
5. ✅ Testing database constraints
6. ✅ Testing security (user isolation)
7. ✅ Using Clerk testing approach
8. ✅ Complete lifecycle validation

This test serves as a reference implementation for integration testing best practices.

