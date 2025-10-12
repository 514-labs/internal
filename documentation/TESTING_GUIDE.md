

# Testing Guide - Analytics Integration Layer

## Test Types & Requirements

### Unit Tests ✅ (Always Work)
```bash
pnpm run test:analytics:unit
```

- **Requirements**: None (uses mocks automatically)
- **Speed**: Fast (~1 second)
- **Coverage**: 123 tests across all modules
- **API Keys**: Uses test values from jest.setup.ts
- **Status**: ✅ 100% passing

### Integration Tests ⚠️ (Require Real API Keys)
```bash
pnpm run test:analytics:integration
```

- **Requirements**: Real API keys for each service
- **Speed**: Slower (actual API calls)
- **Coverage**: 38 tests for all API endpoints
- **API Keys**: Checks for real keys, warns if using mocks
- **Status**: Warns when keys missing, uses mocks as fallback

## Setting Up Integration Tests

### Step 1: Check Current Configuration

Run integration tests to see what's needed:

```bash
pnpm run test:analytics:integration
```

You'll see output like:

```
📊 Integration Test Configuration Status:

  ✅ Supabase (required)
  ❌ PostHog (required)
      Missing: POSTHOG_API_KEY, POSTHOG_PROJECT_ID
  ❌ Linear (required)
      Missing: LINEAR_API_KEY


❌ INTEGRATION TESTS REQUIRE REAL API KEYS

The following API keys are missing or set to test values:

  PostHog:
    ⚠️  POSTHOG_API_KEY - Using test value (need real key)
    ⚠️  POSTHOG_PROJECT_ID - Using test value (need real key)

  Linear:
    ⚠️  LINEAR_API_KEY - Using test value (need real key)

To run integration tests with real APIs, add these to .env.local:

# PostHog
POSTHOG_API_KEY=your_real_key_here
POSTHOG_PROJECT_ID=your_real_key_here

# Linear
LINEAR_API_KEY=your_real_key_here
```

### Step 2: Add Real API Keys

Update your `.env.local` with real keys (see `.env.test.example`):

```bash
# PostHog - Get from https://app.posthog.com/project/settings
POSTHOG_API_KEY=phc_your_real_key  # NOT test_posthog_key
POSTHOG_PROJECT_ID=12345

# Linear - Get from https://linear.app/settings/api  
LINEAR_API_KEY=lin_api_your_real_key  # NOT test_linear_key
```

### Step 3: Run Integration Tests

```bash
pnpm run test:analytics:integration
```

Now you'll see:

```
📊 Integration Test Configuration Status:

  ✅ Supabase (required)
  ✅ PostHog (required)
  ✅ Linear (required)

✅ All required API keys are configured for integration tests
```

## Test Commands

### Run All Tests
```bash
pnpm run test:analytics
```
Runs both unit and integration tests.

### Unit Tests Only (No API Keys Needed)
```bash
pnpm run test:analytics:unit
```
Fast, isolated tests with mocks. Always works.

### Integration Tests (Require Real Keys)
```bash
pnpm run test:analytics:integration
```
Tests actual API endpoints. Shows warnings if keys missing.

### E2E Tests
```bash
pnpm run test:analytics:e2e
```
End-to-end flows including API key lifecycle.

### With Coverage
```bash
pnpm run test:analytics:coverage
```
Shows test coverage report (80% threshold).

### Watch Mode
```bash
pnpm run test:analytics:watch
```
Auto-runs tests on file changes.

## Understanding Test Output

### ✅ When Keys Are Configured
```
📊 Integration Test Configuration Status:

  ✅ PostHog (required)
  ✅ Linear (required)

✅ All required API keys are configured for integration tests

PASS __tests__/analytics/integration/api-routes/posthog.test.ts
PASS __tests__/analytics/integration/api-routes/linear.test.ts

Test Suites: 5 passed
Tests: 38 passed
```

### ⚠️ When Keys Are Missing (Fallback to Mocks)
```
📊 Integration Test Configuration Status:

  ✅ Supabase (required)
  ❌ PostHog (required)
      Missing: POSTHOG_API_KEY, POSTHOG_PROJECT_ID
  ❌ Linear (required)  
      Missing: LINEAR_API_KEY

⚠️  PostHog integration tests will use MOCKS because real API keys are not configured.
To test against real PostHog API, set in .env.local:
  POSTHOG_API_KEY=phc_your_real_key
  POSTHOG_PROJECT_ID=your_project_id

⚠️  Integration tests will run with MOCKS.
Add real API keys to .env.local for full integration testing.
```

Tests will still run but use mocks instead of real APIs.

## Where to Get API Keys

| Service | Where to Get It | Format |
|---------|----------------|--------|
| PostHog | [Project Settings](https://app.posthog.com/project/settings) | `phc_...` |
| Linear | [API Settings](https://linear.app/settings/api) | `lin_api_...` |
| Supabase | `pnpm run db:start` (local) | `eyJ...` (JWT) |

## Test Validation Logic

The test suite automatically:

1. **Checks environment variables** before running integration tests
2. **Detects test vs real keys** (rejects keys starting with `test_`)
3. **Shows clear warnings** about which keys are missing
4. **Uses mocks as fallback** so tests don't fail completely
5. **Prints configuration status** at the start of E2E tests

## Example: Adding PostHog Integration Testing

```bash
# 1. Get your PostHog API key
# Go to https://app.posthog.com/project/settings
# Copy "Project API Key"

# 2. Add to .env.local
echo "POSTHOG_API_KEY=phc_abc123..." >> .env.local
echo "POSTHOG_PROJECT_ID=12345" >> .env.local

# 3. Run tests
pnpm run test:analytics:integration

# You'll see:
# ✅ PostHog (required)
# Tests will now call real PostHog API
```

## Troubleshooting

### "Using test value (need real key)"

Your `.env.local` has:
```bash
POSTHOG_API_KEY=test_posthog_key  # ❌ Test value detected
```

Change to:
```bash
POSTHOG_API_KEY=phc_your_real_key  # ✅ Real key
```

### "Integration tests will run with MOCKS"

This means one or more services don't have real API keys configured. The tests will still run using mocked responses, but won't validate actual API interactions.

**To fix**: Add the missing API keys shown in the error message.

### "Tests are failing with real API keys"

If tests fail with real API keys:
1. Verify the keys are correct (try in Postman/curl)
2. Check API rate limits haven't been exceeded  
3. Verify network connectivity
4. Check API permissions/scopes

## Best Practices

1. **Development**: Use mocks (faster, no API calls)
   ```bash
   # Don't set real keys in .env.local
   pnpm run test:analytics:unit
   ```

2. **Pre-deployment**: Test with real APIs
   ```bash
   # Add real keys to .env.local
   pnpm run test:analytics:integration
   ```

3. **CI/CD**: Use real keys in secrets
   ```bash
   # GitHub Actions, etc.
   # Store real keys as secrets
   # Set in test environment
   ```

## Summary

- ✅ **Unit tests**: Always work, no setup needed
- ⚠️ **Integration tests**: Need real API keys, show clear warnings
- 📝 **Clear errors**: Tells you exactly which keys to add
- 🔄 **Fallback**: Uses mocks if keys missing
- 🚀 **Production-ready**: Can test both mocked and real APIs

Run `pnpm run test:analytics:integration` to see your current configuration status!

