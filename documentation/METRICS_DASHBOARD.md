# PostHog Metrics Dashboard Implementation

## Overview

A comprehensive metrics dashboard has been implemented for tracking key metrics across Boreal (hosting service) and Moosestack (framework) products, powered by PostHog analytics.

## Features

### 1. Date Range Selection
- Configurable time windows with preset options (7, 30, 90 days)
- Custom date range picker with calendar UI
- Support for multi-period comparison (extendable)

### 2. Overview Metrics
- Total Users across all products
- Daily Active Users (DAU) with per-product breakdown
- Monthly Active Users (MAU) with per-product breakdown
- Total Events tracked in the period

### 3. Product-Specific Metrics

#### Boreal (Hosting Service)
- DAU/MAU
- Conversion Rate (to production usage)
- Engagement Score (events per user)
- Deployments count
- Active Projects count
- Daily active users trend chart

#### Moosestack (Framework)
- DAU/MAU
- Conversion Rate (to production builds)
- Engagement Score (events per user)
- Installation count
- Documentation views
- Build count
- Daily active users trend chart

### 4. Journey Metrics with Visual Flows

Six codified user journeys are tracked with visual flow diagrams:

**Boreal Journeys:**
1. **Onboarding**: `boreal_signup` → `boreal_project_created` → `boreal_first_deployment` → `boreal_domain_configured`
2. **Activation**: `boreal_account_created` → `boreal_environment_setup` → `boreal_app_deployed` → `boreal_production_traffic`
3. **Retention**: `boreal_first_deploy` → `boreal_week_1_activity` → `boreal_week_4_activity` → `boreal_month_3_active`

**Moosestack Journeys:**
1. **Discovery**: `moosestack_docs_landing` → `moosestack_docs_read` → `moosestack_install_viewed` → `moosestack_installed`
2. **First Value**: `moosestack_installed` → `moosestack_init_project` → `moosestack_first_build` → `moosestack_dev_server`
3. **Adoption**: `moosestack_first_project` → `moosestack_feature_used` → `moosestack_production_build` → `moosestack_repeat_usage`

Each journey displays:
- Visual flow diagram using React Flow
- Completion rate
- User counts at each step
- Drop-off rates between steps
- Color-coded nodes based on performance

## Technical Implementation

### File Structure

```
lib/analytics/posthog/
├── schemas.ts         # Extended with new metric types
├── journeys.ts        # Codified journey definitions
└── queries.ts         # New query functions for metrics

app/api/analytics/posthog/metrics/
├── route.ts           # Overview metrics endpoint
├── product/route.ts   # Product-specific metrics endpoint
└── journeys/route.ts  # Journey metrics endpoint

app/metrics/
├── page.tsx           # Main metrics page with error handling
└── _components/
    ├── metrics-client.tsx            # Main orchestration component
    ├── date-range-selector.tsx       # Date range picker
    ├── metric-card.tsx               # Reusable metric card
    ├── overview-metrics-card.tsx     # Overview metrics display
    ├── boreal-metrics-card.tsx       # Boreal product metrics
    ├── moosestack-metrics-card.tsx   # Moosestack product metrics
    ├── journey-metrics-card.tsx      # Journey metrics with tabs
    └── journey-flow-diagram.tsx      # React Flow visualization
```

### Dependencies Added

- `@xyflow/react` (v12.8.6) - For journey flow visualizations
- shadcn/ui components:
  - `chart` - For metric charts
  - `calendar` - For date selection
  - `tabs` - For journey tabs

### API Routes

**GET `/api/analytics/posthog/metrics`**
- Query params: `startDate`, `endDate`
- Returns: Overview metrics across all products

**GET `/api/analytics/posthog/metrics/product`**
- Query params: `product` (boreal|moosestack), `startDate`, `endDate`
- Returns: Product-specific metrics with chart data

**GET `/api/analytics/posthog/metrics/journeys`**
- Query params: `journeyId` (optional), `startDate`, `endDate`
- Returns: All journeys or specific journey with funnel data

### HogQL Queries

The implementation uses PostHog's HogQL query language to:
- Calculate DAU (distinct users per day)
- Calculate MAU (distinct users in 30-day period)
- Track conversion rates through funnel analysis
- Measure engagement scores (events per user)
- Analyze journey step completion rates

### Data Flow

1. User selects date range in UI
2. React Query fetches data from API routes
3. API routes execute HogQL queries via PostHog client
4. Results are processed and returned with metadata
5. UI components render metrics with charts and visualizations

## Configuration

### Environment Variables Required

```env
POSTHOG_API_KEY=your_api_key
POSTHOG_PROJECT_ID=your_project_id
POSTHOG_HOST=https://app.posthog.com  # Optional, defaults to this
```

### Error Handling

The dashboard includes comprehensive error handling:
- Configuration errors display helpful setup messages
- API errors are caught and displayed gracefully
- Loading states with skeleton components
- Empty states for missing data

## Usage

### Accessing the Dashboard

Navigate to `/metrics` in your application. The page will:
1. Check for PostHog configuration
2. Display configuration error if not set up
3. Load initial data for last 30 days
4. Allow date range customization

### Data Requirements

For the dashboard to display meaningful data, your application should track PostHog events following the naming convention:
- `{product}_{event_name}` (e.g., `boreal_signup`, `moosestack_installed`)
- Include `product` property in event metadata where applicable

## Future Enhancements

Potential improvements for future iterations:
1. Comparison period selection and display
2. Export metrics to CSV/PDF
3. Custom journey builder UI
4. Alerts and anomaly detection
5. Cohort analysis
6. Retention curves
7. Revenue metrics integration
8. A/B test results visualization

## Testing

To test the dashboard:
1. Set up PostHog credentials in `.env.local`
2. Ensure PostHog events are being tracked
3. Navigate to `/metrics`
4. Verify all cards load without errors
5. Test date range selection
6. Switch between journey tabs
7. Click journey badges to view different flows

## Performance Considerations

- React Query caching (5-minute stale time)
- Server-side error handling
- Lazy loading of journey details
- Optimized HogQL queries
- Client-side rendering for interactive elements

## Troubleshooting

**Dashboard shows configuration error:**
- Verify `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are set
- Check that credentials are valid

**No data displayed:**
- Ensure PostHog events are being tracked
- Verify event names match expected format
- Check selected date range includes data

**Charts not rendering:**
- Verify chart component is installed
- Check browser console for errors
- Ensure data format matches expected structure

