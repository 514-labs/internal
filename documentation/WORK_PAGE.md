# Work Page Documentation

## Overview

The Work page provides a real-time dashboard of Linear activity, displaying active projects, initiatives, and recently completed issues. It uses server-side rendering for initial data load and TanStack Query for client-side data management and real-time updates.

## Features

### Active Projects Card
- Displays all projects with state "started" in Linear
- Shows project name, icon, progress percentage, and target date
- Progress bar with percentage indicator
- Links directly to Linear project pages

### Active Initiatives Card
- Displays all initiatives with status "active" in Linear
- Shows initiative name, description, and target date
- Displays count of associated projects
- Icon support for visual identification

### Recently Completed Feed
- Shows the last 10 completed issues from Linear
- Displays issue identifier, title, completion time, and assignee
- Color-coded status indicators
- Links directly to Linear issue pages
- Shows assignee avatar and name

## Technical Implementation

### Architecture
- **Server Component**: `app/work/page.tsx` fetches initial data server-side
- **Client Component**: `app/work/_components/work-client.tsx` manages client-side state with TanStack Query
- **Card Components**: Individual components for each data display type

### Data Flow
1. Server component fetches initial data from Linear API on page load
2. Initial data passed to client component as props
3. TanStack Query initializes with server data
4. Client-side queries refetch data on window focus and mount
5. Real-time updates when user switches tabs or focuses window

### API Endpoints Used
- `GET /api/analytics/linear/projects?state=started` - Active projects
- `GET /api/analytics/linear/initiatives?status=active` - Active initiatives  
- `GET /api/analytics/linear/issues?completed=true&limit=10` - Recent completions

## Testing

### E2E Tests
Location: `__tests__/e2e/work-page.test.ts`

Run tests:
```bash
pnpm test:e2e              # Run all E2E tests
pnpm test:e2e:ui           # Run with Playwright UI
pnpm test:e2e:headed       # Run in headed mode
pnpm test:e2e:debug        # Run in debug mode
```

Test coverage includes:
- Page load and basic rendering
- Active projects display with data
- Active initiatives display with data
- Recently completed issues feed
- Empty states when no data available
- Loading states
- Link functionality to Linear

## Configuration

### Query Refresh Settings
Located in `lib/query-client.ts`:
- `staleTime`: 5 minutes (data considered fresh for 5 minutes)
- `refetchOnWindowFocus`: true (refetch when user focuses window)
- `retry`: 1 (retry failed requests once)

### Linear API Filters
- **Projects**: Filtered by `state: "started"`
- **Initiatives**: Filtered by `status: "active"`
- **Issues**: Filtered by `completed: true`, ordered by `completedAt`, limited to 10

## Components

### WorkClient
Main client component that orchestrates data fetching and display.
- Path: `app/work/_components/work-client.tsx`
- Uses TanStack Query hooks for each data type
- Handles loading and error states

### ActiveProjectsCard
Displays active projects with progress indicators.
- Path: `app/work/_components/active-projects-card.tsx`
- Shows progress bars and target dates
- Clickable links to Linear

### ActiveInitiativesCard
Displays active initiatives with project counts.
- Path: `app/work/_components/active-initiatives-card.tsx`
- Shows associated project counts
- Target date display

### RecentlyCompletedFeed
Timeline of recently completed issues.
- Path: `app/work/_components/recently-completed-feed.tsx`
- Chronological display (most recent first)
- Shows assignee information with avatars

## Dependencies

- `@tanstack/react-query` - Client-side data fetching and caching
- `date-fns` - Date formatting utilities
- `@linear/sdk` - Linear API client

## Error Handling

The work page includes comprehensive error handling:

### Configuration Errors

If Linear is not configured, you'll see a detailed error message with:
- Clear explanation of the problem
- Step-by-step instructions to fix it
- Current environment status

Example:
```
Configuration Error

Linear is not configured.

You need to set up Linear authentication using ONE of these methods:

Option 1 - Linear API Key (Recommended for development):
  1. Get your API key from: https://linear.app/settings/api
  2. Add to .env.local: LINEAR_API_KEY=your_api_key_here
  3. Restart your dev server
```

### Database Migration Errors

If database migrations haven't been run:
```
Database migration required: The 'integration_tokens' table does not exist

To fix this error, run the database migrations:
  1. Ensure local Supabase is running: pnpm db:start
  2. Run migrations: pnpm db:migrate
  3. Restart your Next.js dev server
```

See:
- [Error Handling Guide](./ERROR_HANDLING.md) - Technical error handling
- [User Error Experience](./USER_ERROR_EXPERIENCE.md) - User-facing error UI

## Future Enhancements

Potential improvements:
- Filter by team or project
- Customizable refresh intervals
- Export functionality
- Issue creation from the page
- Drag-and-drop priority changes
- Real-time WebSocket updates

