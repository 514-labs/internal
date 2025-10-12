# Environment Setup for Integration Tests

## Quick Reference

Integration tests require **REAL API keys**, not test values. Add these to `.env.local`:

```bash
# Supabase (REQUIRED)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PostHog (get from https://app.posthog.com/project/settings)
POSTHOG_API_KEY=phc_your_real_key_here
POSTHOG_PROJECT_ID=12345

# Linear (get from https://linear.app/settings/api)
LINEAR_API_KEY=lin_api_your_real_key_here

# Rippling (get from Rippling admin panel)
RIPPLING_API_KEY=your_real_rippling_key
RIPPLING_API_URL=https://api.rippling.com
```

## Test Validation

### Check What's Configured

Run any integration test to see configuration status:

```bash
pnpm run test:analytics:integration
```

Output will show:
```
📊 Integration Test Configuration Status:

  ✅ Supabase (required)
  ❌ PostHog (required)
      Missing: POSTHOG_API_KEY, POSTHOG_PROJECT_ID
  ❌ Linear (required)
      Missing: LINEAR_API_KEY
  ❌ Rippling (required)
      Missing: RIPPLING_API_KEY
```

### Invalid Key Patterns

The validator rejects:
- ❌ `test_posthog_key` - Test values
- ❌ `test_linear_key` - Test values  
- ❌ Empty values
- ✅ `phc_abc123...` - Real keys
- ✅ `lin_api_xyz...` - Real keys

## Service-Specific Setup

### PostHog
```bash
# 1. Go to https://app.posthog.com/project/settings
# 2. Copy "Project API Key" (starts with phc_)
# 3. Copy "Project ID" (numeric)

POSTHOG_API_KEY=phc_abc123yourkeyhere
POSTHOG_PROJECT_ID=12345
```

### Linear
```bash
# 1. Go to https://linear.app/settings/api
# 2. Click "Create new" or use existing key
# 3. Copy the key (starts with lin_api_)

LINEAR_API_KEY=lin_api_abc123yourkeyhere
```

### Rippling
```bash
# 1. Log in to Rippling admin panel
# 2. Navigate to API settings
# 3. Generate or copy API key

RIPPLING_API_KEY=your_rippling_key_here
RIPPLING_API_URL=https://api.rippling.com
```

### Supabase (Local)
```bash
# 1. Start Supabase
pnpm run db:start

# 2. Copy service_role key from output
# Look for: "service_role key: eyJ..."

SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## What Happens Without Real Keys?

### Unit Tests
✅ **Always work** - use mocks, no API calls

```bash
pnpm run test:analytics:unit

# Output:
Test Suites: 15 passed
Tests: 123 passed
# Fast, no API keys needed
```

### Integration Tests Without Keys
⚠️ **Show warnings** - use mocks with clear messages

```bash
pnpm run test:analytics:integration

# Output:
⚠️  PostHog integration tests will use MOCKS because real API keys are not configured.
To test against real PostHog API, set in .env.local:
  POSTHOG_API_KEY=phc_your_real_key
  POSTHOG_PROJECT_ID=your_project_id

Test Suites: 6 passed
Tests: 38 passed (using mocks)
```

### Integration Tests With Keys
✅ **Test real APIs** - actual integration validation

```bash
pnpm run test:analytics:integration

# Output:
✅ All required API keys are configured for integration tests

# Tests will make real API calls to:
# - PostHog API
# - Linear GraphQL API
# - Rippling REST API

Test Suites: 6 passed
Tests: 38 passed (real API calls)
```

## Recommended Workflow

### Local Development
```bash
# Use unit tests (fast, no setup)
pnpm run test:analytics:unit
```

### Before Deployment
```bash
# Add real keys to .env.local
# Run integration tests
pnpm run test:analytics:integration

# Verify all services work with real APIs
```

### CI/CD Pipeline
```bash
# Store real API keys as secrets
# Set in GitHub Actions / CI environment
# Run both unit and integration tests

pnpm run test:analytics
```

## Error Messages Explained

### "Using test value (need real key)"
```
⚠️  POSTHOG_API_KEY - Using test value (need real key)
```

**Meaning**: Your .env.local has `POSTHOG_API_KEY=test_posthog_key`

**Fix**: Replace with real key: `POSTHOG_API_KEY=phc_real_key`

### "NOT SET"
```
❌ LINEAR_API_KEY - NOT SET
```

**Meaning**: Variable not in .env.local at all

**Fix**: Add `LINEAR_API_KEY=lin_api_your_key` to .env.local

### "Supabase not configured"
```
❌ Supabase (required)
    Missing: SUPABASE_SERVICE_ROLE_KEY
```

**Meaning**: Database not started or key not set

**Fix**: 
```bash
pnpm run db:start
# Copy service_role key to .env.local
```

## Validation Rules

Keys are considered **real** (not test values) if they:
- ✅ Don't start with `test_`
- ✅ Have actual values (not empty)
- ✅ Follow expected format for that service

Keys are considered **test/mock** values if they:
- ❌ Start with `test_` (e.g., `test_posthog_key`)
- ❌ Are empty/undefined
- ❌ Match mock patterns

## FAQ

**Q: Can I run tests without real API keys?**
A: Yes! Unit tests always work. Integration tests will use mocks and show warnings.

**Q: Will tests fail if I don't have real keys?**
A: No, they'll show clear warnings but still pass using mocks. This lets you develop without API access.

**Q: How do I test against real APIs?**
A: Add real API keys to .env.local. The validator will detect them and tests will use real API calls.

**Q: Can I test just one service?**
A: Yes, set real keys for that service only. Others will use mocks:
```bash
# Only PostHog with real API
POSTHOG_API_KEY=phc_real_key
POSTHOG_PROJECT_ID=12345

# Others will use mocks
LINEAR_API_KEY=test_linear_key
```

**Q: How do I know if my real keys are working?**
A: The configuration status will show ✅ for configured services:
```
📊 Integration Test Configuration Status:
  ✅ PostHog (required)  ← Real key detected
  ❌ Linear (required)   ← Using mock
```

## Complete Example

```bash
# 1. Start Supabase
pnpm run db:start

# 2. Copy service_role key to .env.local
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 3. Add PostHog keys
POSTHOG_API_KEY=phc_abc123...
POSTHOG_PROJECT_ID=12345

# 4. Check status
pnpm run test:analytics:integration

# 5. See clear output:
📊 Integration Test Configuration Status:
  ✅ Supabase (required)
  ✅ PostHog (required)
  ❌ Linear (required)
      Missing: LINEAR_API_KEY
  ❌ Rippling (required)
      Missing: RIPPLING_API_KEY

# 6. Add remaining keys as needed
```

## Summary

✅ Clear error messages when keys missing
✅ Shows exactly which environment variables to set
✅ Distinguishes between test and real values
✅ Falls back to mocks gracefully
✅ Provides configuration status before running tests

No more guessing which keys you need! 🎉

