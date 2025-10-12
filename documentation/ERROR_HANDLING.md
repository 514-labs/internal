# Error Handling Guide

## Overview

This project uses detailed, actionable error messages instead of silent failures. When something goes wrong, you'll see clear instructions on how to fix it.

## Error Types

### ConfigurationError

Thrown when required environment variables or database setup is missing.

**Example scenarios:**
- Missing Linear API key or OAuth token
- Supabase not configured
- Database tables not migrated

**What you'll see:**
```
Configuration Error

Linear is not configured.

You need to set up Linear authentication using ONE of these methods:

Option 1 - Linear API Key (Recommended for development):
  1. Get your API key from: https://linear.app/settings/api
  2. Add to .env.local: LINEAR_API_KEY=your_api_key_here
  3. Restart your dev server

Option 2 - Linear OAuth (For production):
  1. Ensure Supabase is running: pnpm db:start
  2. Run migrations: pnpm db:migrate
  3. Visit /settings/integrations to connect Linear

Current environment:
  - LINEAR_API_KEY: ✗ Not set
  - SUPABASE_URL: ✓ Set
```

### Database Migration Required Error

Thrown when trying to use OAuth features without running database migrations.

**Error message:**
```
Database migration required: The 'integration_tokens' table does not exist in the database.

To fix this error, run the database migrations:
  1. Ensure local Supabase is running: pnpm db:start
  2. Run migrations: pnpm db:migrate
  3. Restart your Next.js dev server

Original error: Could not find the table 'public.integration_tokens' in the schema cache
Error code: 42P01
```

## How to Fix Common Errors

### "Linear is not configured"

**Option 1: Use Linear API Key (Quickest)**
```bash
# Get your API key from https://linear.app/settings/api
echo "LINEAR_API_KEY=lin_api_xxxxx" >> .env.local
pnpm dev
```

**Option 2: Use Linear OAuth**
```bash
# Start Supabase
pnpm db:start

# Run migrations
pnpm db:migrate

# Restart dev server
pnpm dev

# Visit http://localhost:3000/settings/integrations to connect
```

### "integration_tokens table does not exist"

This means database migrations haven't been run.

```bash
# Start local Supabase
pnpm db:start

# Run migrations
pnpm db:migrate

# Restart your Next.js server
# Press Ctrl+C and run:
pnpm dev
```

### "Supabase database is not configured"

This means environment variables are missing.

```bash
# Start Supabase to get the connection details
pnpm db:start

# Add to .env.local:
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=<get_from_db_status>

# Get the service role key:
pnpm db:status

# Restart dev server
pnpm dev
```

## Error Display

### In the UI

Configuration errors are displayed using shadcn Alert components with:
- ❌ Destructive alert banner with clear messaging
- 🎯 Actionable cards showing configuration options
- 🔑 Direct links to Linear API settings
- 📋 Step-by-step instructions for each option
- 🔧 Collapsible technical details section
- ✅ Visual indicators of what's configured vs missing
- 🔗 Clickable buttons to fix the issue (e.g., "Get Linear API Key", "Go to Integrations Settings")

### In the Console

All errors include:
- Detailed error message
- Error code (if applicable)
- Context about what failed
- Instructions to fix
- Current configuration status

## Best Practices

### For Developers

1. **Never silence errors** - Let them propagate with context
2. **Always provide fixes** - Every error should explain how to resolve it
3. **Show current state** - Display what's configured and what's missing
4. **Be specific** - Instead of "Database error", say "Table X doesn't exist"

### Example: Good Error Message

```typescript
throw new ConfigurationError(
  "Linear is not configured.\n\n" +
  "You need to set up Linear authentication using ONE of these methods:\n\n" +
  "Option 1 - Linear API Key:\n" +
  "  1. Get key from: https://linear.app/settings/api\n" +
  "  2. Add to .env.local: LINEAR_API_KEY=your_key\n\n" +
  `Current: LINEAR_API_KEY is ${apiKey ? "set" : "not set"}`
);
```

### Example: Bad Error Message

```typescript
// ❌ Don't do this
console.warn("Linear not configured");
return null;

// ❌ Don't do this
throw new Error("Configuration error");
```

## Error Recovery

Most configuration errors can be recovered from without restarting:

1. **Fix the issue** (add env var, run migration)
2. **Restart the dev server** (Ctrl+C then `pnpm dev`)
3. **Refresh the browser**

For database changes, you may need to:
```bash
pnpm db:reset  # Reset and reapply all migrations
pnpm dev       # Restart server
```

## Testing Errors

To test error messages:

1. **Remove environment variable:**
```bash
# Comment out in .env.local
# LINEAR_API_KEY=xxx
```

2. **Visit the page** - You should see detailed error

3. **Fix it** - Follow the instructions in the error

4. **Verify** - Page should load successfully

## Debugging Tips

### Check Environment Variables
```bash
# In your code:
console.log('LINEAR_API_KEY:', process.env.LINEAR_API_KEY ? 'Set' : 'Not set');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
```

### Check Database Tables
```bash
pnpm db:status  # Shows if Supabase is running
```

Visit Studio: http://localhost:54323
- Check if `integration_tokens` table exists
- Check if data is present

### Check Migrations
```bash
# See what migrations exist
ls supabase/migrations/

# Reset and reapply all migrations
pnpm db:reset
```

## See Also

- [Work Page Documentation](./WORK_PAGE.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Linear OAuth Implementation](./LINEAR_OAUTH_IMPLEMENTATION.md)

