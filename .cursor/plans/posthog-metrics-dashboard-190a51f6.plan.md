<!-- 190a51f6-fd93-4cbd-865b-23e7d1c177e4 12c4b783-377c-4c2b-b4d6-c9e899540304 -->
# PostHog Metrics Dashboard Implementation

## Overview

Transform the static metrics page into a dynamic PostHog-powered dashboard with generic SaaS metrics (DAU/MAU, conversion rates, engagement) organized by product area, with configurable time windows and multi-period comparison.

## Architecture

### 1. Schema & Type Extensions

**File**: `lib/analytics/posthog/schemas.ts`

Add new schemas for:

- `MetricCardData` - generic structure for metric cards with current value, comparison values, trend indicators
- `TimeWindow` - configurable date range with comparison periods
- `ProductMetrics` - DAU/MAU, conversion rate, engagement score per product area
- `JourneyMetrics` - funnel data for standard + custom journeys
- `OverviewMetrics` - aggregated company-wide metrics

### 2. Query Functions

**File**: `lib/analytics/posthog/queries.ts`

Add functions to fetch:

- `getProductMetrics(product: 'hosting' | 'framework' | 'ai', timeWindow)` - DAU/MAU using HogQL queries on distinct users, conversion rates from event funnels, engagement scores from event frequency
- `getJourneyMetrics(timeWindow)` - funnel analytics for signup → activation → engagement → conversion, plus any custom journey definitions
- `getOverviewMetrics(timeWindow)` - company-wide aggregations across all products
- `compareMetricPeriods(metric, periods[])` - helper to calculate period-over-period changes

### 3. API Routes

**Directory**: `app/api/analytics/posthog/metrics/`

Create endpoints:

- `route.ts` - GET overview metrics
- `product/route.ts` - GET metrics filtered by product query param
- `journeys/route.ts` - GET journey funnel data
- `compare/route.ts` - GET multi-period comparison data

Each route validates time windows, calls query functions, and returns structured JSON.

### 4. UI Components

**Directory**: `app/metrics/_components/`

Create:

- `metric-card.tsx` - reusable card displaying metric value, trend, comparison chips, mini chart using shadcn chart components
- `date-range-selector.tsx` - date picker with presets (7d, 30d, 90d, custom) using shadcn popover + calendar
- `comparison-period-manager.tsx` - UI to add/remove comparison periods with badges
- `hosting-metrics-card.tsx` - specific card for hosting service metrics
- `framework-metrics-card.tsx` - specific card for framework metrics  
- `ai-metrics-card.tsx` - specific card for AI capabilities metrics
- `journey-metrics-card.tsx` - funnel visualization card
- `overview-metrics-card.tsx` - high-level company metrics
- `metrics-client.tsx` - client component orchestrating data fetching with React Query

### 5. Metrics Page

**File**: `app/metrics/page.tsx`

Transform to:

- Server component that handles errors gracefully (similar to `app/work/page.tsx` pattern)
- Passes initial data to `<MetricsClient />` 
- Shows configuration error UI if PostHog not configured

### 6. Chart Integration

- Install shadcn chart component if not present: `pnpm dlx shadcn@latest add @shadcn/chart`
- Use Bar charts for metric comparisons, Line charts for trends, Area charts for cumulative metrics
- For any specialized charts (funnel visualization), build custom using recharts components

## Data Flow

1. User selects date range + comparison periods in UI
2. Client components fetch from API routes with time window params
3. API routes call PostHog query functions with HogQL queries
4. HogQL queries calculate DAU (distinct users per day), MAU (distinct users per 30 days), conversion rates (funnel completion %), engagement (events per user)
5. Data returned, compared across periods, rendered in cards with charts

## Key Metrics by Product

**Hosting Service**: DAU/MAU, uptime events, deployment count, error rate
**Framework**: DAU/MAU, installation events, GitHub stars proxy, documentation views
**AI Capabilities**: DAU/MAU, API calls, token usage, feature adoption rate

**Journeys**:

- Standard: Signup → Activation → First Value → Retained
- Custom: Define using event sequences in journey card UI

## Technical Details

- Use `date-fns` for date manipulation and period calculations
- Leverage existing PostHog client in `lib/analytics/posthog/client.ts`
- Follow error handling patterns from work page
- Use React Query for data fetching with stale-while-revalidate
- Implement loading skeletons using shadcn skeleton component
- Add proper TypeScript typing throughout

### To-dos

- [ ] Extend PostHog schemas with metric types, time windows, and product-specific structures
- [ ] Implement PostHog query functions for product metrics, journeys, and comparisons using HogQL
- [ ] Create API routes for metrics endpoints with validation and error handling
- [ ] Add shadcn chart component to project if not already present
- [ ] Build reusable metric card components and date range selectors
- [ ] Create specific metric cards for hosting, framework, and AI products
- [ ] Build journey metrics card with funnel visualization
- [ ] Transform metrics page to use dynamic data with client component orchestration