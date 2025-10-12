# Linear OAuth 2.0 Testing

## Overview

All Linear integration tests have been updated to accommodate the OAuth 2.0 authentication pattern with automatic fallback to API keys.

## Test Coverage for OAuth

### ✅ Unit Tests (16 suites, 139 tests passing)

**New OAuth-Specific Tests:**

1. **`__tests__/analytics/unit/linear/client-oauth.test.ts`** (13 tests)
   - ✅ OAuth token authentication
   - ✅ API key fallback
   - ✅ OAuth takes priority over API key
   - ✅ Token caching (60-second window)
   - ✅ Client reset after token operations
   - ✅ Expired token handling
   - ✅ Missing refresh token handling

2. **`__tests__/analytics/unit/linear/queries.test.ts`** (Updated)
   - ✅ Tests now set up OAuth tokens before running
   - ✅ Works with both OAuth and API key modes

### 🆕 Integration Tests for OAuth Flow

**`__tests__/analytics/integration/e2e/linear-oauth-flow.test.ts`**

Tests complete OAuth lifecycle:
```typescript
Store tokens → Retrieve → Auto-refresh → Revoke → Verify deleted
```

**Coverage:**
- ✅ `storeLinearTokens()` - Store OAuth tokens in Supabase
- ✅ `getLinearTokens()` - Retrieve stored tokens
- ✅ `getValidLinearToken()` - Get token with auto-refresh
- ✅ `refreshLinearToken()` - Manual token refresh
- ✅ `revokeLinearToken()` - Token revocation
- ✅ `isLinearConnected()` - Connection status check
- ✅ Token expiration with 5-minute buffer
- ✅ Upsert behavior (one token per integration)
- ✅ Graceful handling when Supabase not configured

**`__tests__/analytics/integration/api-routes/linear-oauth.test.ts`**

Tests OAuth API endpoints:
- ✅ `GET /api/integrations/linear/authorize` - OAuth initiation
  - Redirects to Linear with PKCE challenge
  - Includes `actor=app` parameter
  - Admin-only access
- ✅ `GET /api/integrations/linear/callback` - OAuth callback
  - Token exchange
  - State validation (CSRF protection)
  - Stores tokens in database
- ✅ `POST /api/integrations/linear/disconnect` - Revocation
  - Revokes token with Linear API
  - Deletes from database
  - Admin-only access
- ✅ `GET /api/integrations/linear/status` - Status check
  - Shows connection status
  - Token expiration info
  - Admin-only access

## Authentication Flow

### OAuth (Primary Method)
```
1. Admin clicks "Connect Linear" in UI
2. GET /api/integrations/linear/authorize
   - Generates PKCE challenge
   - Stores verifier in secure cookie
   - Redirects to Linear with actor=app
3. User authorizes in Linear
4. Linear redirects to /api/integrations/linear/callback?code=...
5. Backend exchanges code for tokens (with PKCE verifier)
6. Tokens stored in integration_tokens table
7. Linear client uses OAuth token for all requests
8. Tokens auto-refresh before expiration (5-min buffer)
```

### API Key (Fallback)
```
1. If OAuth not configured
2. Linear client checks LINEAR_API_KEY env var
3. Uses API key for authentication
4. No automatic refresh (static key)
```

## How Tests Handle OAuth

### Unit Tests
```typescript
// Set up OAuth tokens for test
__setMockTokens({
  access_token: "test_oauth_token",
  refresh_token: "test_refresh",
  token_type: "Bearer",
  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  scope: "read,write",
});

// Run test - will use OAuth
const client = await getLinearClient();
```

### Testing API Key Fallback
```typescript
// Clear OAuth tokens
__clearMockTokens();

// Set API key
process.env.LINEAR_API_KEY = "test_api_key";

// Run test - will use API key
const client = await getLinearClient();
```

### Testing Both Methods
```typescript
// OAuth takes priority
__setMockTokens({ /* OAuth tokens */ });
process.env.LINEAR_API_KEY = "api_key";

const client = await getLinearClient();
// Uses OAuth, not API key
```

## Mock Implementation

**`__mocks__/lib/integrations/linear-oauth.ts`**

Provides test utilities:
- `__setMockTokens(tokens)` - Set OAuth tokens for test
- `__clearMockTokens()` - Remove OAuth tokens
- `__getMockRefreshCount()` - Check how many times token was refreshed

Mocks all OAuth functions:
- `getValidLinearToken()` - Returns mock token with auto-refresh
- `storeLinearTokens()` - Stores in mock state
- `refreshLinearToken()` - Simulates token refresh
- `revokeLinearToken()` - Clears mock tokens
- `isLinearConnected()` - Checks mock token state

## Running OAuth Tests

### All Linear Tests
```bash
# Run all Linear-related tests
pnpm run test __tests__/analytics/unit/linear
pnpm run test __tests__/analytics/integration/api-routes/linear
pnpm run test __tests__/analytics/integration/e2e/linear-oauth-flow.test.ts
```

### OAuth-Specific Tests
```bash
# New OAuth tests
pnpm run test __tests__/analytics/unit/linear/client-oauth.test.ts
pnpm run test __tests__/analytics/integration/e2e/linear-oauth-flow.test.ts
pnpm run test __tests__/analytics/integration/api-routes/linear-oauth.test.ts
```

### Integration Tests with Real OAuth
```bash
# To test with REAL Linear OAuth:
# 1. Connect Linear via OAuth in your app UI
# 2. Tokens will be stored in Supabase integration_tokens table
# 3. Run integration tests
pnpm run test:analytics:integration

# Tests will detect OAuth tokens and use them!
```

## Configuration Status in Tests

When you run integration tests, you'll see:

### With OAuth Connected
```
📊 Integration Test Configuration Status:

  ✅ Supabase (required)
  ✅ Linear (required) - OAuth configured
      Token expires: 2024-10-12T10:00:00Z
      Scope: read,write

✅ Linear integration will use OAUTH tokens from database
```

### With API Key Only
```
📊 Integration Test Configuration Status:

  ✅ Linear (required) - API key configured
      Using: LINEAR_API_KEY environment variable

⚠️  Linear integration will use API KEY (OAuth not connected)
To use OAuth, connect Linear via /settings/integrations
```

### Not Configured
```
❌ Linear (required)
    ❌ LINEAR_API_KEY - NOT SET
    ❌ OAuth - NOT connected

❌ LINEAR NOT CONFIGURED
Set LINEAR_API_KEY in .env.local OR connect via OAuth
```

## Key Features Tested

✅ **OAuth Priority** - OAuth used when available, API key as fallback
✅ **Token Refresh** - Automatic refresh before expiration (5-min buffer)
✅ **Token Storage** - Secure storage in Supabase with upsert
✅ **Admin Control** - Only admins can connect/disconnect
✅ **PKCE Flow** - Code challenge generation and verification
✅ **State Validation** - CSRF protection in OAuth callback
✅ **Actor Type** - Uses `actor=app` for workspace-level integration
✅ **Graceful Degradation** - Falls back to API key if OAuth fails
✅ **Client Caching** - 60-second cache with manual reset option

## Migration from API Key to OAuth

Tests accommodate both methods:

### Before (API Key Only)
```typescript
// Old test setup
process.env.LINEAR_API_KEY = "lin_api_123";
const client = await getLinearClient(); // Uses API key
```

### After (OAuth with Fallback)
```typescript
// New test setup - OAuth
__setMockTokens({ access_token: "oauth_123", ... });
const client = await getLinearClient(); // Uses OAuth

// OR API key fallback
__clearMockTokens();
process.env.LINEAR_API_KEY = "lin_api_123";
const client = await getLinearClient(); // Uses API key
```

## Database Schema Tested

**`integration_tokens` table:**
```sql
CREATE TABLE integration_tokens (
  id UUID PRIMARY KEY,
  integration_name TEXT UNIQUE,  -- 'linear'
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Tests verify:
- ✅ Upsert on duplicate integration_name
- ✅ Automatic updated_at timestamp
- ✅ Token expiration tracking
- ✅ Scope storage

## Summary

**Tests Updated:**
- 1 new OAuth client test suite (13 tests)
- 1 updated queries test suite (OAuth setup)
- 2 new OAuth integration test suites
- All tests pass with OAuth mock

**Total Linear Test Coverage:**
- Unit: 26 tests (client, schemas, queries)
- Integration: 16 tests (API routes, OAuth flow)
- **Total: 42 tests** for Linear integration

**OAuth Support:**
- ✅ All tests work with OAuth
- ✅ All tests work with API key fallback
- ✅ Tests validate both authentication methods
- ✅ Clear warnings when neither is configured

Run `pnpm run test:analytics:unit` to see all **139 tests passing**! 🎉

