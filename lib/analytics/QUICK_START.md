# Analytics Integration - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Add Your API Keys

Create or update `.env.local`:

```bash
# Required for PostHog
POSTHOG_API_KEY=phc_your_key_here
POSTHOG_PROJECT_ID=12345
POSTHOG_HOST=https://app.posthog.com

# Required for Linear (OAuth - Recommended)
LINEAR_CLIENT_ID=your_client_id
LINEAR_CLIENT_SECRET=your_client_secret
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# OR use API key (Legacy)
# LINEAR_API_KEY=lin_api_your_key_here

# Required for Rippling
RIPPLING_API_KEY=your_rippling_key
RIPPLING_API_URL=https://api.rippling.com
```

### Step 2: Setup Supabase (Required)

API keys are securely stored in Supabase, so you must set this up first:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Copy the service_role key from output to .env.local
```

Add to `.env.local`:
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Generate an API Key

Create a simple API route or script to generate your first API key:

```typescript
// app/api/generate-api-key/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateApiKey } from '@/lib/auth/api-keys';

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const apiKey = await generateApiKey(userId, body.keyName || 'My API Key');
  
  return NextResponse.json({ 
    apiKey,
    warning: 'Save this key! It will not be shown again.'
  });
}
```

Visit `/api/generate-api-key` (as a signed-in user) to get your API key.

### Step 4: Test Your First Query

```bash
# Save your API key
export API_KEY="sk_analytics_..."

# Test PostHog
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/analytics/posthog/events?limit=5

# Test Linear
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/analytics/linear/issues?limit=5

# Test Rippling
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/analytics/rippling/company
```

## 🔐 Linear OAuth Setup (Recommended)

Linear integration now supports OAuth 2.0 authentication with automatic token refresh. This is the recommended approach for production environments.

### Benefits of OAuth

- ✅ **Workspace-level integration** - One connection for the entire workspace
- ✅ **Automatic token refresh** - Tokens refresh automatically (no manual rotation)
- ✅ **App actor** - All resources created as the app (consistent attribution)
- ✅ **Admin-controlled** - Only admins can connect/disconnect
- ✅ **Secure storage** - Tokens stored in Supabase, not environment variables

### Setup Steps

#### 1. Create a Linear OAuth Application

1. Visit [Linear Settings → API](https://linear.app/settings/api)
2. Click **"Create New OAuth Application"**
3. Fill in the details:
   - **Application Name**: Your Company Analytics
   - **Description**: Analytics integration for workspace data
   - **Callback URLs**: Add your callback URL(s):
     - Development: `http://localhost:3000/api/integrations/linear/callback`
     - Production: `https://your-domain.com/api/integrations/linear/callback`
   - **Scopes**: Select `read` and `write`
4. Click **"Create Application"**
5. Copy your **Client ID** and **Client Secret**

#### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Linear OAuth Configuration
LINEAR_CLIENT_ID=your_client_id_here
LINEAR_CLIENT_SECRET=your_client_secret_here
LINEAR_OAUTH_REDIRECT_URI=http://localhost:3000/api/integrations/linear/callback

# For production, update the redirect URI:
# LINEAR_OAUTH_REDIRECT_URI=https://your-domain.com/api/integrations/linear/callback
```

#### 3. Connect Linear via Admin UI

1. Sign in as an admin user
2. Navigate to `/settings/integrations`
3. Click **"Connect Linear"**
4. You'll be redirected to Linear to authorize the app
5. Select your workspace and grant permissions
6. After authorization, you'll be redirected back with a success message

#### 4. Verify Connection

```bash
# Check connection status (requires admin auth)
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/integrations/linear/status

# Now use Linear APIs as normal
curl -H "Authorization: Bearer $API_KEY" \
  http://localhost:3000/api/analytics/linear/issues?limit=5
```

### OAuth Token Management

The system automatically handles:

- **Token Storage**: Access and refresh tokens stored securely in Supabase
- **Token Refresh**: Tokens automatically refresh when they expire (24 hours)
- **Token Revocation**: Disconnect button revokes tokens with Linear and removes from database

### Migrating from API Key to OAuth

If you're currently using `LINEAR_API_KEY`:

1. Complete the OAuth setup above
2. Connect Linear via the admin UI
3. The system will automatically use OAuth tokens instead of the API key
4. You can remove `LINEAR_API_KEY` from your environment variables
5. Legacy API key support remains as a fallback

### Troubleshooting OAuth

**"Configuration error" when connecting**
- Verify all three environment variables are set correctly
- Check that the redirect URI matches exactly (including protocol and port)

**"Invalid state" error during callback**
- This is a security feature - try connecting again
- Clear your cookies if the issue persists

**"Token expired" errors**
- The system should auto-refresh - check Supabase logs
- Try disconnecting and reconnecting if refresh fails

**Disconnecting Linear**
1. Visit `/settings/integrations`
2. Click **"Disconnect"** 
3. Confirm the action
4. The OAuth token will be revoked with Linear and removed from the database

## 📖 Common Use Cases

### 1. Display Recent Events in a Dashboard

```typescript
// app/dashboard/page.tsx
import { getEvents } from '@/lib/analytics/posthog/queries';

export default async function DashboardPage() {
  const events = await getEvents({
    limit: 10,
    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  });

  return (
    <div>
      <h1>Recent Events</h1>
      <ul>
        {events.map((event) => (
          <li key={event.uuid}>
            {event.event} - {event.distinct_id}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 2. Show Team Issues from Linear

```typescript
// app/team/issues/page.tsx
import { getIssues } from '@/lib/analytics/linear/queries';

export default async function IssuesPage() {
  const issues = await getIssues({
    limit: 50,
    includeArchived: false,
  });

  return (
    <div>
      <h1>Team Issues</h1>
      {issues.map((issue) => (
        <div key={issue.id}>
          <h3>{issue.identifier}: {issue.title}</h3>
          <p>State: {issue.state?.name}</p>
          <p>Assignee: {issue.assignee?.name}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Employee Directory from Rippling

```typescript
// app/team/employees/page.tsx
import { getEmployees } from '@/lib/analytics/rippling/queries';

export default async function EmployeesPage() {
  const employees = await getEmployees({
    status: 'ACTIVE',
    limit: 100,
  });

  return (
    <div>
      <h1>Employee Directory</h1>
      {employees.map((employee) => (
        <div key={employee.id}>
          <h3>{employee.firstName} {employee.lastName}</h3>
          <p>{employee.title}</p>
          <p>Department: {employee.department?.name}</p>
          <p>Email: {employee.email}</p>
        </div>
      ))}
    </div>
  );
}
```

### 4. HubSpot Contacts Dashboard

```typescript
// app/crm/contacts/page.tsx
import { getHubspotContacts } from '@/lib/analytics/posthog/queries';

export default async function ContactsPage() {
  const contacts = await getHubspotContacts({
    limit: 50,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  return (
    <div>
      <h1>HubSpot Contacts</h1>
      {contacts.map((contact) => (
        <div key={contact.id}>
          <h3>{contact.firstname} {contact.lastname}</h3>
          <p>Email: {contact.email}</p>
          <p>Company: {contact.company}</p>
          <p>Stage: {contact.lifecyclestage}</p>
        </div>
      ))}
    </div>
  );
}
```

### 5. API Route for External Access

```typescript
// app/api/external/team-metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth } from '@/lib/auth/api-keys';
import { getIssues } from '@/lib/analytics/linear/queries';
import { getEvents } from '@/lib/analytics/posthog/queries';

export async function GET(request: NextRequest) {
  try {
    // Authenticate
    await withApiKeyAuth(request);

    // Fetch data from multiple sources
    const [issues, events] = await Promise.all([
      getIssues({ limit: 100 }),
      getEvents({ limit: 100 }),
    ]);

    // Calculate metrics
    const openIssues = issues.filter(
      (i) => i.state?.type === 'started' || i.state?.type === 'unstarted'
    );
    const completedIssues = issues.filter(
      (i) => i.state?.type === 'completed'
    );

    return NextResponse.json({
      issues: {
        total: issues.length,
        open: openIssues.length,
        completed: completedIssues.length,
      },
      events: {
        total: events.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
```

### 6. Discover Data Sources

```bash
# Discover what HubSpot data is available
pnpm run analytics:discover-hubspot

# Sample contacts
pnpm run analytics:discover-hubspot -- --table contacts --limit 10

# Sample deals
pnpm run analytics:discover-hubspot -- --table deals --limit 10
```

### 7. User Journey Analysis

```typescript
// app/analytics/journey/[userId]/page.tsx
import { getJourneys } from '@/lib/analytics/posthog/queries';

export default async function JourneyPage({
  params,
}: {
  params: { userId: string };
}) {
  const journey = await getJourneys(params.userId, {
    limit: 1000,
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return (
    <div>
      <h1>User Journey: {journey.distinct_id}</h1>
      <p>Period: {journey.start_time} to {journey.end_time}</p>
      <h2>Events ({journey.steps.length})</h2>
      <ol>
        {journey.steps.map((step, index) => (
          <li key={index}>
            {step.event} at {step.timestamp}
          </li>
        ))}
      </ol>
    </div>
  );
}
```

## 🔧 Troubleshooting

### "PostHog API key is not configured"

Add to `.env.local`:
```bash
POSTHOG_API_KEY=phc_...
POSTHOG_PROJECT_ID=12345
```

### "Linear API key is not configured"

Add to `.env.local`:
```bash
LINEAR_API_KEY=lin_api_...
```

### "Invalid API key"

1. Generate a new API key using the `/api/generate-api-key` route
2. Make sure you're using the full key starting with `sk_analytics_`
3. Check that the key hasn't been revoked

## 📚 More Examples

See the full documentation in `lib/analytics/README.md` for:
- Complete API reference
- Error handling patterns
- Adding new integrations
- Security best practices
- Advanced query examples

## 🎯 Quick Reference

### Query Functions

| Service | Function | Purpose |
|---------|----------|---------|
| PostHog | `getEvents()` | Fetch events with filters |
| PostHog | `getPageViews()` | Aggregate page views |
| PostHog | `getJourneys()` | User journey analysis |
| PostHog | `getHubspotContacts()` | HubSpot contacts |
| Linear | `getIssues()` | Fetch issues |
| Linear | `getProjects()` | Fetch projects |
| Linear | `getInitiatives()` | Fetch initiatives |
| Rippling | `getCompany()` | Company details |
| Rippling | `getEmployees()` | Employee list |

### API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/analytics/posthog/events` | Query events |
| GET | `/api/analytics/posthog/journeys` | User journeys |
| GET | `/api/analytics/posthog/pageviews` | Page analytics |
| GET | `/api/analytics/posthog/hubspot` | HubSpot data |
| GET | `/api/analytics/linear/issues` | Linear issues |
| GET | `/api/analytics/linear/projects` | Linear projects |
| GET | `/api/analytics/rippling/company` | Company info |
| GET | `/api/analytics/rippling/employees` | Employees |

## 💡 Tips

1. **Use TypeScript**: All functions are fully typed with Zod validation
2. **Handle errors**: Use try-catch and check for `AnalyticsError` types
3. **Cache results**: Use Supabase (when configured) for expensive queries
4. **Rate limiting**: Monitor API usage to avoid hitting rate limits
5. **Discovery first**: Use discovery scripts before writing complex queries

## 🚀 Ready to Build!

You now have everything you need to integrate analytics into your app. Start with the examples above and explore the full documentation for advanced use cases.

Happy coding! 🎉

