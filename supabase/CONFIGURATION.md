# Supabase Configuration

This project uses Supabase **only for database storage** (PostgreSQL). All other Supabase services are disabled.

## Enabled Services

### ✅ Database (PostgreSQL)
- **Port**: 54322
- **Purpose**: Store API keys with Row Level Security
- **Tables**: `api_keys`, future analytics caching tables

### ✅ API (PostgREST)
- **Port**: 54321
- **Purpose**: Provides REST API access to the database
- **Used by**: `@supabase/supabase-js` client in `lib/analytics/supabase/client.ts`

### ✅ Studio (Admin UI)
- **Port**: 54323
- **Purpose**: Web interface to manage database, view tables, run SQL queries
- **Access**: http://localhost:54323
- **Command**: `pnpm run db:studio`

## Disabled Services

All other Supabase services are disabled since they're not needed:

### ❌ Auth
- **Reason**: Clerk handles all authentication
- **Alternative**: Use Clerk for user authentication and authorization

### ❌ Storage
- **Reason**: Not storing files, only database records
- **Alternative**: If file storage is needed later, use S3 or similar

### ❌ Realtime
- **Reason**: Not using real-time subscriptions
- **Alternative**: Implement polling or webhooks if needed

### ❌ Edge Functions
- **Reason**: Using Next.js API routes instead
- **Alternative**: API routes in `app/api/analytics/`

### ❌ Inbucket (Email Testing)
- **Reason**: Clerk handles email for auth
- **Alternative**: Use production email service if needed

### ❌ Analytics (Supabase)
- **Reason**: Using PostHog, Linear, Rippling for analytics
- **Alternative**: Custom analytics integration layer

## Configuration File

All settings are in `supabase/config.toml`. Key sections:

```toml
[db]
port = 54322
major_version = 17

[api]
enabled = true
port = 54321

[studio]
enabled = true
port = 54323

[auth]
enabled = false  # Clerk handles auth

[storage]
enabled = false  # Not needed

[realtime]
enabled = false  # Not needed

[edge_runtime]
enabled = false  # Using Next.js API routes

[analytics]
enabled = false  # Using external analytics
```

## Why This Configuration?

This minimal configuration:
- **Reduces resource usage** - Only runs necessary services
- **Faster startup** - Fewer services to initialize
- **Simpler setup** - Less configuration required
- **Clear purpose** - Supabase is only for secure database storage
- **Better separation** - Each service has a clear responsibility:
  - Clerk → Authentication
  - Supabase → Database (API keys)
  - PostHog → Product analytics
  - Linear → Project management data
  - Rippling → Employee data

## What You Get

When you run `pnpm run db:start`:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
        anon key: eyJ...
service_role key: eyJ...  ← Use this in .env.local!
   JWT secret key: ...
```

**Important**: Even though some services show URLs, only these are actually running:
- Database (54322)
- API (54321)
- Studio (54323)

## Ports Used

| Port | Service | Status |
|------|---------|--------|
| 54321 | API (PostgREST) | ✅ Enabled |
| 54322 | Database (PostgreSQL) | ✅ Enabled |
| 54323 | Studio (Admin UI) | ✅ Enabled |
| 54324 | Inbucket (Email) | ❌ Disabled |
| 54327 | Analytics | ❌ Disabled |
| 8083 | Edge Functions Inspector | ❌ Disabled |

## Modifying Configuration

To enable/disable services, edit `supabase/config.toml`:

```toml
[service_name]
enabled = true  # or false
```

Then restart Supabase:
```bash
pnpm run db:stop
pnpm run db:start
```

## Production Considerations

For production deployment:
1. Create Supabase project at https://supabase.com
2. Same services will be disabled in production config
3. Use connection pooling for better performance
4. Enable SSL for database connections
5. Use the service_role key (not anon key) in production env vars

## Need More Services?

If you later need:
- **Storage**: Enable storage in config, use for file uploads
- **Realtime**: Enable for live data subscriptions
- **Edge Functions**: Enable for serverless functions (alternative to Next.js API routes)

Just set `enabled = true` in the respective section and restart.

