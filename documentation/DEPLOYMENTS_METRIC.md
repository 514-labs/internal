# Cumulative Deployments Per Organization Metric

This document describes the Cumulative Deployments Per Organization metric, which tracks deployment activity over time from the PostHog data warehouse.

## Overview

The Cumulative Deployments metric provides insight into deployment activity by tracking deployments from the `postgres.deploys` table joined with `postgres.projects` data warehouse tables. It calculates cumulative deployment counts over time with breakdown by organization ID.

## Features

- **Cumulative Tracking**: Shows cumulative deployment counts over time (not just new deployments per period)
- **Organization Breakdown**: Separates data by organization ID
- **Flexible Time Intervals**: Supports day, week, or month intervals
- **Top N Filtering**: Limits display to top N organizations with an "other" category for the rest
- **Status Filtering**: Optional filtering by deployment status (success, failed, pending, etc.)
- **Smart Aggregation**: Automatically aggregates smaller organizations into "other" category
- **Cross-Table Join**: Joins deployment and project data to get organization context

## Implementation

### Query Function

The main query function is located in `lib/analytics/posthog/queries.ts`:

```typescript
getCumulativeDeployments(
  timeWindow: { startDate: string; endDate: string },
  options?: {
    breakdownProperty?: string;
    intervalUnit?: "day" | "week" | "month";
    topN?: number;
    statusFilter?: string[];
  }
): Promise<CumulativeDeploymentsMetrics>
```

**Parameters:**
- `timeWindow.startDate`: ISO 8601 date string for the start of the period
- `timeWindow.endDate`: ISO 8601 date string for the end of the period
- `options.breakdownProperty`: Property to break down by (default: "org_id")
- `options.intervalUnit`: Time interval granularity (default: "month")
- `options.topN`: Maximum number of organizations to show individually (default: 25)
- `options.statusFilter`: Array of deployment statuses to include (optional)

**Returns:**
```typescript
{
  timeWindow: TimeWindow;
  totalDeployments: number;
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
GET /api/analytics/posthog/metrics/deployments
```

**Query Parameters:**
- `startDate` (required): ISO 8601 date string
- `endDate` (required): ISO 8601 date string
- `breakdownProperty` (optional): Property to break down by
- `intervalUnit` (optional): "day", "week", or "month" (default: "month")
- `topN` (optional): Number of top organizations to show (default: 25)
- `statusFilter` (optional): Comma-separated list of statuses

**Example:**
```bash
curl "http://localhost:3000/api/analytics/posthog/metrics/deployments?startDate=2024-10-01T00:00:00.000Z&endDate=2024-11-30T23:59:59.999Z&intervalUnit=month&topN=10&statusFilter=success,completed"
```

### UI Component

The metric is displayed in the Metrics dashboard using the `DeploymentsCard` component located at `app/metrics/_components/deployments-card.tsx`.

The card displays:
1. Total cumulative deployments
2. Total unique organizations
3. Average deployments per organization
4. List of top 5 organizations by deployment count
5. Line chart showing cumulative growth over time for each organization

## Data Source

The query reads from two joined tables in the PostHog data warehouse:

### postgres.deploys
- `deploy_id`: Unique deployment identifier
- `url`: Deployment URL
- `status`: Deployment status
- `created_at`: Timestamp when deployment was created
- `project_id`: Foreign key to projects table

### postgres.projects
- `project_id`: Unique project identifier
- `name`: Project name
- `repo_url`: Repository URL
- `org_id`: Organization ID that owns the project

## Key Metrics

### Total Deployments
Sum of all deployments across all organizations at the end of the time window.

### Total Organizations
Count of unique organization IDs (excluding "unknown").

### Average Deployments per Organization
Total deployments divided by total organizations.

### Top Organizations
Organizations sorted by their total deployment count, limited to top N.

### Other Organizations
When there are more than `topN` organizations, the remaining organizations are aggregated into an "other" category.

## HogQL Query Structure

The underlying query:

1. **Join Query**: Joins `postgres.deploys` with `postgres.projects` to get organization context
2. **Base Query**: Counts deployments per interval grouped by organization
3. **Cumulative Sum**: Uses `sum() OVER (PARTITION BY breakdown_value ORDER BY day_start)` to calculate running totals
4. **Top N Filtering**: Limits to top N organizations and aggregates the rest
5. **Result Processing**: Transforms results into breakdown series with cumulative data points

## Status Filtering

You can filter deployments by status to track specific outcomes:

```typescript
await getCumulativeDeployments(
  timeWindow,
  {
    statusFilter: ["success", "completed"]
  }
);
```

Common status values might include:
- `success` / `completed`
- `failed` / `error`
- `pending` / `in_progress`
- `cancelled` / `aborted`

## Color System

The chart automatically generates distinct colors for up to 10 organizations using a predefined color palette:
- Green (#10b981)
- Blue (#3b82f6)
- Amber (#f59e0b)
- Purple (#8b5cf6)
- Pink (#ec4899)
- Cyan (#06b6d4)
- Lime (#84cc16)
- Orange (#f97316)
- Indigo (#6366f1)
- Red (#ef4444)

Colors cycle if there are more than 10 organizations.

## Testing

Tests are located in `__tests__/analytics/unit/posthog/deployments.test.ts` and cover:
- Default behavior with multiple organizations
- Empty results handling
- Custom breakdown properties
- Different interval units (day, week, month)
- Status filtering
- Top N filtering with "other" category
- Sorting by deployment count
- Excluding unknown organizations
- Default interval unit
- Join query structure

Run tests with:
```bash
pnpm test __tests__/analytics/unit/posthog/deployments.test.ts
```

## Usage in Dashboard

The metric is automatically displayed in the Metrics dashboard under the "Deployment Activity" section. It uses the date range selector to adjust the time window.

## Configuration

### Interval Units

- **Day**: Best for short time windows (< 1 month) or high deployment frequency
- **Week**: Good for medium time windows (1-3 months)
- **Month**: Best for long time windows (> 3 months) - default

### Top N Organizations

By default, the API limits results to the top 25 organizations. You can adjust this:
- Lower values (5-10) for cleaner charts
- Higher values (50-100) for more detailed analysis

### Status Filtering

Filter by deployment status to analyze:
- Success rate (only successful deployments)
- Failure analysis (only failed deployments)
- Active deployments (pending/in-progress statuses)

## Use Cases

1. **Deployment Velocity**: Track how quickly organizations are deploying
2. **Organization Activity**: Identify most active organizations
3. **Success Rate Analysis**: Filter by success status to see successful deployments
4. **Capacity Planning**: Understand deployment patterns for resource allocation
5. **Customer Health**: Low deployment activity might indicate customer churn risk
6. **Platform Usage**: Overall platform deployment activity trends

## Comparison with Projects Metric

While Projects metric tracks **project creation**, Deployments metric tracks **deployment activity**:

- Projects: One-time creation event per project
- Deployments: Recurring activity, multiple deployments per project
- Projects show growth in user base
- Deployments show ongoing platform usage and engagement

## Future Enhancements

Potential improvements:
1. Add deployment duration tracking
2. Include deployment status breakdown in charts
3. Track deployment frequency (deployments per day)
4. Add project-level deployment metrics
5. Monitor deployment failure rates
6. Track time between deployments
7. Add deployment size/complexity metrics
8. Geographic distribution of deployments
9. Peak deployment time analysis
10. Deployment rollback tracking

