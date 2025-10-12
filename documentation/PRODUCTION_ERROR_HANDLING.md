# Production Error Handling for Work Page

## Overview

The work page is designed to gracefully handle errors in production without crashing the application. Instead of showing a 500 error page, users see actionable configuration prompts.

## Error Handling Strategy

### Server-Side (Initial Page Load)

**Location**: `app/work/page.tsx`

**Strategy**: Multi-level error catching with pattern matching

```typescript
try {
  // Fetch Linear data
} catch (error) {
  // 1. ConfigurationError - Direct match
  if (error instanceof ConfigError) {
    return <ConfigurationError message={error.message} />;
  }

  // 2. AnalyticsError - Check message content
  if (error instanceof AnalyticsError) {
    if (message.includes("Linear is not configured")) {
      return <ConfigurationError message={error.message} />;
    }
  }

  // 3. Generic Error - Pattern matching
  if (error instanceof Error) {
    if (message.includes("LINEAR_API_KEY")) {
      return <ConfigurationError message={error.message} />;
    }
  }

  // 4. Fallback - Show generic error UI
  return <ConfigurationError message={...} />;
}
```

### Client-Side (Data Refresh)

**Location**: `app/work/_components/work-client.tsx`

**Strategy**: TanStack Query error handling

```typescript
useQuery({
  queryKey: ["projects"],
  queryFn: fetchProjects,
  retry: false,        // Don't retry config errors
  throwOnError: false, // Handle gracefully
});
```

**Fetch Functions**: Enhanced error extraction

```typescript
if (!res.ok) {
  const data = await res.json().catch(() => ({ error: "..." }));
  throw new Error(data.message || data.error || "...");
}
return data.data || []; // Fallback to empty array
```

## Error Scenarios Handled

### 1. Linear Not Configured

**Trigger**: No `LINEAR_API_KEY` and no OAuth token

**User sees**:
- ✅ Beautiful error UI with action cards
- ✅ "Get Linear API Key" button
- ✅ "Go to Integrations Settings" button
- ✅ Step-by-step instructions

**App behavior**:
- ✅ No crash
- ✅ Navigation still works
- ✅ Other pages accessible

### 2. Database Migration Not Run

**Trigger**: `integration_tokens` table missing

**User sees**:
- ✅ Database setup required card
- ✅ Commands to run migrations
- ✅ Clear instructions

**App behavior**:
- ✅ No crash
- ✅ Falls back to API key if available
- ✅ Clear error message

### 3. Invalid OAuth Token

**Trigger**: Token expired or revoked

**User sees**:
- ✅ Error explaining token issue
- ✅ Link to reconnect Linear
- ✅ Alternative API key option

**App behavior**:
- ✅ No crash
- ✅ Suggests reconnection
- ✅ Provides alternatives

### 4. Network Error

**Trigger**: Can't reach Linear API

**User sees**:
- ✅ Generic error message
- ✅ Technical details (collapsible)

**App behavior**:
- ✅ No crash
- ✅ Shows last cached data (if available)
- ✅ User can retry

### 5. Partial Failure

**Trigger**: One query fails (e.g., initiatives) but others succeed

**User sees**:
- ✅ Projects and issues still display
- ✅ Empty state for failed section
- ✅ No full page error

**App behavior**:
- ✅ Graceful degradation
- ✅ Show what we can
- ✅ Hide failed sections

## Production vs Development

### Development Mode
- More detailed error messages
- Stack traces in console
- Helpful debugging info

### Production Mode
- User-friendly error messages
- No stack traces exposed
- Security-conscious error details

## Testing Error Handling

### Test 1: No Linear Config

```bash
# In .env.local, comment out:
# LINEAR_API_KEY=xxx
```

**Expected**: Configuration error UI, not crash

### Test 2: Invalid API Key

```bash
# Set invalid key
LINEAR_API_KEY=invalid_key
```

**Expected**: Error message about invalid credentials

### Test 3: Network Failure

Mock network failure in browser DevTools

**Expected**: Shows cached data or empty state

### Test 4: Database Not Set Up

```bash
# Don't run migrations
pnpm db:reset --skip-migrations
```

**Expected**: Database setup instructions, not crash

## Error UI Components

### ConfigurationError Component

**Features**:
- Alert banner with clear message
- Action cards with buttons
- Collapsible technical details
- User ID displayed for CLI commands

**Benefits**:
- Non-technical users get clear guidance
- Developers get technical details
- Everyone gets actionable next steps

## Preventing Crashes

### Server-Side Protection

1. **Comprehensive try/catch** - Catches all errors
2. **Pattern matching** - Detects config errors
3. **Fallback UI** - Always returns valid React element
4. **Never throws** - Errors converted to UI

### Client-Side Protection

1. **Query error handling** - `throwOnError: false`
2. **Retry disabled** - `retry: false` for config errors
3. **Empty fallbacks** - `data.data || []`
4. **Loading states** - Graceful transitions

### API Route Protection

Already in place:
- Error catching in all routes
- Proper status codes returned
- Error messages in response body

## Error Recovery

### Auto-Recovery

When user fixes the issue:
1. Page refresh shows correct data
2. TanStack Query refetches automatically
3. No cache clearing needed

### Manual Recovery

User can:
1. Clear filters to see all data
2. Navigate to settings to fix config
3. Refresh page after fixing issues

## Monitoring

### What to Log

In production, log:
- Configuration errors (count)
- API failures (with error codes)
- User actions (fixing errors)

### What NOT to Log

- API keys or tokens
- User personal data
- Full stack traces

## Future Enhancements

- [ ] Toast notifications for errors
- [ ] Automatic retry with backoff
- [ ] Health check endpoint
- [ ] Status page integration
- [ ] Error reporting service (Sentry)

## See Also

- [Error Handling Guide](./ERROR_HANDLING.md)
- [User Error Experience](./USER_ERROR_EXPERIENCE.md)
- [Work Page Documentation](./WORK_PAGE.md)

