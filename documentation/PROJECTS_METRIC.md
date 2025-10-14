# Cumulative Projects Per Organization Metric

This document describes the Cumulative Projects Per Organization metric, which tracks project creation over time from the PostHog data warehouse.

## Overview

The Cumulative Projects metric provides insight into project growth by tracking project creation from the `postgres.projects` data warehouse table. It calculates cumulative project counts over time with breakdown by organization ID.

## Features

- **Cumulative Tracking**: Shows cumulative project counts over time (not just new projects per period)
- **Organization Breakdown**: Separates data by organization ID
- **Flexible Time Intervals**: Supports day, week, or month intervals
- **Top N Filtering**: Limits display to top N organizations with an "other" category for the rest
- **Smart Aggregation**: Automatically aggregates smaller organizations into "other" category

## Implementation

### Query Function

The main query function is located in `lib/analytics/posthog/queries.ts`:

```typescript
getCumulativeProjects(
  timeWindow: { startDate: string; endDate: string },
  options?: {
    breakdownProperty?: string;
    intervalUnit?: "day" | "week" | "month";
    topN?: number;
  }
): Promise<CumulativeProjectsMetrics>
```

**Parameters:**
- `timeWindow.startDate`: ISO 8601 date string for the start of the period
- `timeWindow.endDate`: ISO 8601 date string for the end of the period
- `options.breakdownProperty`: Property to break down by (default: "org_id")
- `options.intervalUnit`: Time interval granularity (default: "month")
- `options.topN`: Maximum number of organizations to show individually (default: 25)

**Returns:**
```typescript
{
  timeWindow: TimeWindow;
  totalProjects: number;
  totalOrganizations: number;
  dataPoints: Array<{
    date: string;
    total: number;
    breakdown: string;
  }>;
  breakdownSeries: Array<{
    breakdown: string;
    dataPoints: Array<{
      date: string;
      cumulativeTotal: number;
    }>;
    total: number;
  }>;
}
```

### API Endpoint

The metric is accessible via the API endpoint:

```
GET /api/analytics/posthog/metrics/projects
```

**Query Parameters:**
- `startDate` (required): ISO 8601 date string
- `endDate` (required): ISO 8601 date string
- `breakdownProperty` (optional): Property to break down by
- `intervalUnit` (optional): "day", "week", or "month" (default: "month")
- `topN` (optional): Number of top organizations to show (default: 25)

**Example:**
```bash
curl "http://localhost:3000/api/analytics/posthog/metrics/projects?startDate=2024-10-01T00:00:00.000Z&endDate=2024-11-30T23:59:59.999Z&intervalUnit=month&topN=10"
```

### UI Component

The metric is displayed in the Metrics dashboard using the `ProjectsCard` component located at `app/metrics/_components/projects-card.tsx`.

The card displays:
1. Total cumulative projects
2. Total unique organizations
3. Average projects per organization
4. List of top 5 organizations by project count
5. Line chart showing cumulative growth over time for each organization

## Data Source

The query reads from the `postgres.projects` table in the PostHog data warehouse. This table should contain:
- `created_at`: Timestamp when the project was created
- `org_id`: Organization ID that owns the project

## Key Metrics

### Total Projects
Sum of all projects across all organizations at the end of the time window.

### Total Organizations
Count of unique organization IDs (excluding "unknown").

### Average Projects per Organization
Total projects divided by total organizations.

### Top Organizations
Organizations sorted by their total project count, limited to top N.

### Other Organizations
When there are more than `topN` organizations, the remaining organizations are aggregated into an "other" category.

## HogQL Query Structure

The underlying query uses window functions to calculate cumulative sums:

1. **Base Query**: Counts projects per interval grouped by organization
2. **Cumulative Sum**: Uses `sum() OVER (PARTITION BY breakdown_value ORDER BY day_start)` to calculate running totals
3. **Top N Filtering**: Limits to top N organizations and aggregates the rest
4. **Result Processing**: Transforms results into breakdown series with cumulative data points

## Color System

The chart automatically generates distinct colors for up to 10 organizations using a predefined color palette:
- Blue (#3b82f6)
- Green (#10b981)
- Amber (#f59e0b)
- Red (#ef4444)
- Purple (#8b5cf6)
- Pink (#ec4899)
- Cyan (#06b6d4)
- Orange (#f97316)
- Lime (#84cc16)
- Indigo (#6366f1)

Colors cycle if there are more than 10 organizations.

## Testing

Tests are located in `__tests__/analytics/unit/posthog/projects.test.ts` and cover:
- Default behavior with multiple organizations
- Empty results handling
- Custom breakdown properties
- Different interval units (day, week, month)
- Top N filtering with "other" category
- Sorting by project count
- Excluding unknown organizations
- Default interval unit

Run tests with:
```bash
pnpm test __tests__/analytics/unit/posthog/projects.test.ts
```

## Usage in Dashboard

The metric is automatically displayed in the Metrics dashboard under the "Project Growth" section. It uses the date range selector to adjust the time window.

## Configuration

### Interval Units

- **Day**: Best for short time windows (< 1 month)
- **Week**: Good for medium time windows (1-3 months)
- **Month**: Best for long time windows (> 3 months) - default

### Top N Organizations

By default, the API limits results to the top 25 organizations. You can adjust this:
- Lower values (5-10) for cleaner charts
- Higher values (50-100) for more detailed analysis

## Future Enhancements

Potential improvements:
1. Add project status breakdown (active vs archived)
2. Include project type or category filtering
3. Add growth rate calculations (MoM, YoY)
4. Track project activity metrics alongside creation
5. Add organization cohort analysis
6. Support filtering by organization attributes

