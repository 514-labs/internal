# Cumulative OSS Installs Metric

This document describes the Cumulative OSS Installs metric, which tracks CLI installation script runs over time for open source products.

## Overview

The Cumulative OSS Installs metric provides insight into the adoption of open source CLI tools by tracking the `fiveonefour_cli_install_script_run` event in PostHog. It calculates cumulative installation counts over time with breakdown by CLI name (moose, aurora, sloan).

## Features

- **Cumulative Tracking**: Shows cumulative installation counts over time (not just daily counts)
- **Product Breakdown**: Separates data by CLI name (moose, aurora, sloan)
- **Developer Filtering**: Excludes internal developers and localhost traffic by default
- **Customizable**: Supports custom breakdown properties and product filters

## Implementation

### Query Function

The main query function is located in `lib/analytics/posthog/queries.ts`:

```typescript
getCumulativeOSSInstalls(
  timeWindow: { startDate: string; endDate: string },
  options?: {
    breakdownProperty?: string;
    products?: string[];
    excludeDevelopers?: boolean;
  }
): Promise<CumulativeOSSInstallMetrics>
```

**Parameters:**
- `timeWindow.startDate`: ISO 8601 date string for the start of the period
- `timeWindow.endDate`: ISO 8601 date string for the end of the period
- `options.breakdownProperty`: Property to break down by (default: "cli_name")
- `options.products`: Array of product names to filter (default: ["moose", "aurora", "sloan"])
- `options.excludeDevelopers`: Whether to exclude internal developers (default: true)

**Returns:**
```typescript
{
  timeWindow: TimeWindow;
  totalInstalls: number;
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
GET /api/analytics/posthog/metrics/oss-installs
```

**Query Parameters:**
- `startDate` (required): ISO 8601 date string
- `endDate` (required): ISO 8601 date string
- `breakdownProperty` (optional): Property to break down by
- `products` (optional): Comma-separated list of products
- `excludeDevelopers` (optional): "true" or "false" (default: "true")

**Example:**
```bash
curl "http://localhost:3000/api/analytics/posthog/metrics/oss-installs?startDate=2025-10-01T00:00:00.000Z&endDate=2025-10-13T23:59:59.999Z"
```

### UI Component

The metric is displayed in the Metrics dashboard using the `OSSInstallsCard` component located at `app/metrics/_components/oss-installs-card.tsx`.

The card displays:
1. Total cumulative installs
2. Breakdown by CLI name with individual totals
3. Line chart showing cumulative growth over time for each product

## Data Filters

When `excludeDevelopers` is enabled (default), the query filters out:
- Events from localhost or 127.0.0.1
- Events with `is_moose_developer: true`
- Events with `is_developer: true`
- Events from users with `fiveonefour.com` email addresses

## HogQL Query Structure

The underlying query uses window functions to calculate cumulative sums:

1. **Base Query**: Counts distinct users per day grouped by breakdown property
2. **Cumulative Sum**: Uses `sum() OVER (PARTITION BY breakdown_value ORDER BY day_start)` to calculate running totals
3. **Result Processing**: Transforms results into breakdown series with cumulative data points

## Testing

Tests are located in `__tests__/analytics/unit/posthog/oss-installs.test.ts` and cover:
- Default behavior with multiple products
- Empty results handling
- Custom breakdown properties
- Custom product filters
- Developer filtering options
- Sorting by total installs

Run tests with:
```bash
pnpm test __tests__/analytics/unit/posthog/oss-installs.test.ts
```

## Usage in Dashboard

The metric is automatically displayed in the Metrics dashboard under the "Open Source Adoption" section. It uses the date range selector to adjust the time window.

## Future Enhancements

Potential improvements:
1. Add comparison periods to show growth rates
2. Include geographic breakdown
3. Add conversion tracking from install to active usage
4. Track installation method (npm, curl, etc.)
5. Add cohort analysis for installation retention

