# Analytics Integration Layer

A comprehensive, type-safe analytics integration system for PostHog, Linear, Rippling, and HubSpot (via PostHog Data Warehouse).

## Architecture Overview

This analytics layer provides:
- **Type-safe clients** with Zod validation
- **Consistent query interfaces** across all services
- **Token-protected public APIs** using Clerk authentication
- **Comprehensive error handling** with custom error types
- **Well-abstracted query functions** for easy integration

All authentication is handled by Clerk (both UI and API key-based for programmatic access).

## Directory Structure

```
lib/analytics/
├── shared/
│   ├── types.ts          # Shared types and interfaces
│   └── errors.ts         # Custom error classes
├── posthog/
│   ├── client.ts         # PostHog client setup
│   ├── schemas.ts        # Zod schemas for PostHog data
│   └── queries.ts        # Query functions
├── linear/
│   ├── client.ts         # Linear SDK wrapper
│   ├── schemas.ts        # Zod schemas for Linear data
│   └── queries.ts        # Query functions
├── rippling/
│   ├── client.ts         # Rippling REST API client
│   ├── schemas.ts        # Zod schemas for Rippling data
│   └── queries.ts        # Query functions
└── supabase/
    └── client.ts         # Supabase DB client (placeholder)
```

## Setup

### 1. Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
pnpm add posthog-node @linear/sdk @supabase/supabase-js
```

### 2. Configure Environment Variables

Copy the environment variables template and fill in your API keys:

```bash
# PostHog
POSTHOG_API_KEY=your_api_key
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_HOST=https://app.posthog.com

# Linear (OAuth - Recommended)
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# OR use API key (Legacy)
# LINEAR_API_KEY=your_api_key

# Rippling
RIPPLING_API_KEY=your_api_key
RIPPLING_API_URL=https://api.rippling.com

# Supabase (optional - for future persistence)
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Supabase Setup (REQUIRED)

**Important**: Supabase is required for API key storage. API keys are securely stored in Supabase with Row Level Security, NOT in Clerk metadata.

For local development:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize Supabase in your project
supabase init

# Start local Supabase (PostgreSQL + Studio)
supabase start

# This will output your local credentials:
# - API URL: http://localhost:54321
# - Service Role Key: eyJ... (use this in .env)

# IMPORTANT: Use the SERVICE_ROLE_KEY, not anon key!
```

Add to `.env.local`:
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

For production, create a Supabase project at https://supabase.com and use production credentials.

## Usage Examples

### PostHog

```typescript
import { getEvents, getPageViews, getJourneys } from '@/lib/analytics/posthog/queries';

// Get events
const events = await getEvents({
  limit: 100,
  startDate: '2024-01-01T00:00:00Z',
  eventName: 'signup_completed',
});

// Get page views
const pageViews = await getPageViews({
  limit: 50,
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-31T23:59:59Z',
});

// Get user journey
const journey = await getJourneys('user_123', {
  limit: 1000,
});
```

### HubSpot (via PostHog Data Warehouse)

```typescript
import {
  getHubspotContacts,
  getHubspotDeals,
  getHubspotCompanies,
} from '@/lib/analytics/posthog/queries';

// Get HubSpot contacts
const contacts = await getHubspotContacts({
  limit: 100,
  sortBy: 'created_at',
  sortOrder: 'desc',
});

// Get HubSpot deals
const deals = await getHubspotDeals({
  limit: 50,
});
```

### Linear

```typescript
import {
  getIssues,
  getProjects,
  getInitiatives,
  getUsers,
} from '@/lib/analytics/linear/queries';

// Get issues
const issues = await getIssues({
  limit: 50,
  teamId: 'team_123',
  stateId: 'state_in_progress',
});

// Get projects
const projects = await getProjects({
  limit: 25,
  search: 'analytics',
});

// Get initiatives
const initiatives = await getInitiatives();
```

### Rippling

```typescript
import {
  getCompany,
  getEmployees,
  getEmployee,
  getDepartments,
} from '@/lib/analytics/rippling/queries';

// Get company details
const company = await getCompany();

// Get all employees
const employees = await getEmployees({
  limit: 100,
  status: 'ACTIVE',
});

// Get specific employee
const employee = await getEmployee('emp_123');

// Get departments
const departments = await getDepartments();
```

## API Endpoints

All analytics data is accessible via token-protected API endpoints.

### Authentication

Two methods are supported:

1. **API Key** (recommended for programmatic access):
```bash
curl -H "Authorization: Bearer sk_analytics_..." \
  https://your-app.com/api/analytics/posthog/events
```

2. **Clerk Session** (for UI):
```typescript
// Authenticated users can access APIs directly
const response = await fetch('/api/analytics/posthog/events');
```

### PostHog Endpoints

- `GET /api/analytics/posthog/events` - Get events
- `GET /api/analytics/posthog/journeys` - Get user journeys
- `GET /api/analytics/posthog/pageviews` - Get page view analytics
- `GET /api/analytics/posthog/hubspot` - Get HubSpot data

### Linear Endpoints

- `GET /api/analytics/linear/issues` - Get issues
- `GET /api/analytics/linear/projects` - Get projects
- `GET /api/analytics/linear/initiatives` - Get initiatives
- `GET /api/analytics/linear/users` - Get users

### Rippling Endpoints

- `GET /api/analytics/rippling/company` - Get company details
- `GET /api/analytics/rippling/employees` - Get employees

## API Key Management

### Security Note

API keys are securely stored in Supabase with Row Level Security (RLS). They are **never** stored in Clerk metadata or exposed to the client. Only SHA-256 hashes are persisted.

### Generate an API Key

```typescript
import { generateApiKey } from '@/lib/auth/api-keys';

const apiKey = await generateApiKey(userId, "My API Key");
// Returns: sk_analytics_...
// Store this securely - it's only shown once!
// The plain text key is never stored in the database
```

### List API Keys

```typescript
import { listApiKeys } from '@/lib/auth/api-keys';

const keys = await listApiKeys(userId);
// Returns array of API key metadata:
// - id, key_name, created_at, last_used_at, revoked, etc.
// - Does NOT include the actual API key (only hashes)
```

### Revoke an API Key

```typescript
import { revokeApiKey } from '@/lib/auth/api-keys';

await revokeApiKey(userId, apiKeyId);
// Revoke by key ID, not hash
```

## Discovery Scripts

Utility scripts to explore data warehouse contents:

### Discover HubSpot (via PostHog)

```bash
# List common HubSpot tables
pnpm tsx scripts/analytics/discover-hubspot.ts

# Sample data from specific table
pnpm tsx scripts/analytics/discover-hubspot.ts --table contacts --limit 10
```

### Sample Data

```bash
# Sample HubSpot data
pnpm tsx scripts/analytics/sample-data.ts --source hubspot --table contacts --limit 5

# Sample Linear issues
pnpm tsx scripts/analytics/sample-data.ts --source linear --type issues --limit 20

# Sample Rippling employees
pnpm tsx scripts/analytics/sample-data.ts --source rippling --type employees
```

## Error Handling

All functions throw custom error types that include:
- HTTP status codes
- Error codes
- Detailed messages
- Optional debug information

```typescript
import {
  AnalyticsError,
  ValidationError,
  AuthenticationError,
  ExternalAPIError,
} from '@/lib/analytics/shared/errors';

try {
  const data = await getEvents(options);
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error (400)
  } else if (error instanceof AuthenticationError) {
    // Handle auth error (401)
  } else if (error instanceof ExternalAPIError) {
    // Handle external service error (502)
  }
}
```

## Adding New Integrations

To add a new analytics integration:

1. **Create directory structure**:
```
lib/analytics/new-service/
├── client.ts
├── schemas.ts
└── queries.ts
```

2. **Implement client** (`client.ts`):
```typescript
import { AnalyticsClient } from '../shared/types';

export class NewServiceClient implements AnalyticsClient {
  async healthCheck(): Promise<boolean> { /* ... */ }
  getName(): string { return 'NewService'; }
}
```

3. **Define schemas** (`schemas.ts`):
```typescript
import { z } from 'zod';

export const DataSchema = z.object({
  // Define your data structure
});
```

4. **Create queries** (`queries.ts`):
```typescript
export async function getData(options: QueryOptions) {
  // Implement query logic
}
```

5. **Add API routes**:
```
app/api/analytics/new-service/
└── endpoint/
    └── route.ts
```

6. **Update middleware** to include new public routes if needed.

## Best Practices

1. **Always validate inputs** with Zod schemas
2. **Use type-safe query options** from `QueryOptions` interface
3. **Handle errors gracefully** with try-catch blocks
4. **Log sensitive operations** (API key generation, admin actions)
5. **Test with discovery scripts** before building production features
6. **Use API keys** for programmatic access, not user sessions
7. **Keep secrets secure** - never commit API keys

## Troubleshooting

### PostHog connection issues
- Verify `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID`
- Check `POSTHOG_HOST` is correct (default: https://app.posthog.com)

### Linear authentication errors
- **OAuth (Recommended)**: Visit `/settings/integrations` to connect Linear
- **API Key (Legacy)**: Regenerate API key from Linear settings
- See `QUICK_START.md` for detailed OAuth setup instructions

### Rippling API errors
- Verify API endpoint URL is correct
- Check API key permissions in Rippling admin

### Supabase local setup
- Run `supabase start` to start local instance
- Use the generated service role key, not anon key

## Future Enhancements

- [ ] Implement caching layer with Supabase
- [ ] Add query result aggregation
- [ ] Create dashboard UI components
- [ ] Add webhook support for real-time updates
- [ ] Implement rate limiting for API endpoints
- [ ] Add query result streaming for large datasets
- [ ] Create TypeScript SDK for external consumers

