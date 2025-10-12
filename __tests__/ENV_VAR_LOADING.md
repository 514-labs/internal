# How Environment Variables Are Loaded in Tests

## Loading Order

1. **Next.js loads .env files** (via `nextJest` in jest.config.ts)
   - Loads `.env.local` first (your real keys)
   - Then `.env.test` (if it exists)
   - Then `.env` (defaults)

2. **jest.setup.ts runs** (after env files loaded)
   - Now uses `||=` pattern to preserve real values
   - Only sets defaults if not already set

## The Fix

### Before (BROKEN)
```typescript
// jest.setup.ts - This OVERWROTE your real keys!
process.env.POSTHOG_API_KEY = "test_posthog_key";  // ❌ Overwrites!
process.env.LINEAR_API_KEY = "test_linear_key";    // ❌ Overwrites!
```

### After (FIXED) ✅
```typescript
// jest.setup.ts - This PRESERVES your real keys!
process.env.POSTHOG_API_KEY = process.env.POSTHOG_API_KEY || "test_posthog_key";  // ✅ Preserves!
process.env.LINEAR_API_KEY = process.env.LINEAR_API_KEY || "test_linear_key";    // ✅ Preserves!
```

## How It Works Now

### Scenario 1: Real Keys in .env.local
```bash
# Your .env.local
POSTHOG_API_KEY=phc_real_key_abc123
LINEAR_API_KEY=lin_api_real_xyz789
```

**Result:**
```typescript
// After loading:
process.env.POSTHOG_API_KEY = "phc_real_key_abc123"  // ✅ Real key preserved
process.env.LINEAR_API_KEY = "lin_api_real_xyz789"   // ✅ Real key preserved
```

Integration test output:
```
✅ PostHog (required)
✅ Linear (required)
```

### Scenario 2: No .env.local or Missing Keys
```bash
# .env.local doesn't exist or keys not set
```

**Result:**
```typescript
// After loading:
process.env.POSTHOG_API_KEY = "test_posthog_key"  // ✅ Fallback for unit tests
process.env.LINEAR_API_KEY = "test_linear_key"    // ✅ Fallback for unit tests
```

Integration test output:
```
❌ PostHog (required)
    ⚠️  POSTHOG_API_KEY - Using test value (need real key)
❌ Linear (required)
    ⚠️  LINEAR_API_KEY - Using test value (need real key)
```

## Testing the Fix

### Check What Keys Are Loaded

Run any integration test:
```bash
pnpm run test:analytics:integration
```

You'll see at the top:
```
📊 Integration Test Configuration Status:

  ✅ Supabase (required)
  ✅ PostHog (required)     ← Now shows ✅ if you have real key!
  ✅ Linear (required)      ← Now shows ✅ if you have real key!
```

### Verify Your Real Keys Are Being Used

Create a simple test:
```typescript
// __tests__/check-env.test.ts
it('should load real keys from .env.local', () => {
  console.log('POSTHOG_API_KEY:', process.env.POSTHOG_API_KEY);
  console.log('LINEAR_API_KEY:', process.env.LINEAR_API_KEY);
  
  // If you have real keys, they should NOT start with "test_"
  if (process.env.POSTHOG_API_KEY !== 'test_posthog_key') {
    console.log('✅ Using REAL PostHog key from .env.local');
  } else {
    console.log('⚠️  Using TEST PostHog key (add real key to .env.local)');
  }
});
```

## Key Validation Logic

The validator in `__tests__/setup/test-config-validator.ts` checks:

```typescript
const missingVars = service.envVars.filter(
  (varName) => !process.env[varName] || process.env[varName]?.startsWith("test_")
);
```

This rejects:
- ❌ Missing values (undefined)
- ❌ Values starting with `test_`
- ✅ Accepts: Real API keys from your .env.local

## Summary

**The Fix:**
- Changed `=` to `||=` pattern in jest.setup.ts
- Now preserves real keys from .env.local
- Falls back to test values only if not set
- Integration tests will detect and use your real keys

**To Use Real Keys:**
1. Add them to `.env.local` (NOT `.env.test`)
2. Run `pnpm run test:analytics:integration`
3. You'll see ✅ for configured services
4. Tests will use real API calls

**Your real PostHog key will now be detected!** 🎉

