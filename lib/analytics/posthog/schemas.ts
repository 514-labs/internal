/**
 * Zod schemas for PostHog data structures
 */

import { z } from "zod";

/**
 * PostHog Event Schema
 */
export const EventSchema = z.object({
  event: z.string(),
  distinct_id: z.string(),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().optional(),
  uuid: z.string().optional(),
});

export type Event = z.infer<typeof EventSchema>;

/**
 * Event query options
 */
export const EventQueryOptionsSchema = z.object({
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eventName: z.string().optional(),
  distinctId: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export type EventQueryOptions = z.infer<typeof EventQueryOptionsSchema>;

/**
 * Page View Schema
 */
export const PageViewSchema = z.object({
  pathname: z.string(),
  timestamp: z.string(),
  distinct_id: z.string(),
  session_id: z.string().optional(),
  duration: z.number().optional(),
  properties: z.record(z.unknown()).optional(),
});

export type PageView = z.infer<typeof PageViewSchema>;

/**
 * Page view aggregate schema
 */
export const PageViewAggregateSchema = z.object({
  pathname: z.string(),
  views: z.number(),
  unique_visitors: z.number(),
  avg_duration: z.number().optional(),
});

export type PageViewAggregate = z.infer<typeof PageViewAggregateSchema>;

/**
 * User Journey Schema
 */
export const JourneyStepSchema = z.object({
  event: z.string(),
  timestamp: z.string(),
  properties: z.record(z.unknown()).optional(),
});

export const JourneySchema = z.object({
  distinct_id: z.string(),
  steps: z.array(JourneyStepSchema),
  start_time: z.string(),
  end_time: z.string(),
  conversion: z.boolean().optional(),
});

export type Journey = z.infer<typeof JourneySchema>;
export type JourneyStep = z.infer<typeof JourneyStepSchema>;

/**
 * Activation Metrics Schema
 */
export const ActivationSchema = z.object({
  distinct_id: z.string(),
  activated: z.boolean(),
  activation_date: z.string().optional(),
  days_to_activate: z.number().optional(),
  activation_events: z.array(z.string()).optional(),
});

export type Activation = z.infer<typeof ActivationSchema>;

/**
 * HubSpot Contact Schema (from PostHog data warehouse)
 */
export const HubspotContactSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  createdate: z.string().optional(),
  lastmodifieddate: z.string().optional(),
  lifecyclestage: z.string().optional(),
  hs_lead_status: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export type HubspotContact = z.infer<typeof HubspotContactSchema>;

/**
 * HubSpot Deal Schema (from PostHog data warehouse)
 */
export const HubspotDealSchema = z.object({
  id: z.string(),
  dealname: z.string().optional(),
  amount: z.number().optional(),
  closedate: z.string().optional(),
  createdate: z.string().optional(),
  dealstage: z.string().optional(),
  pipeline: z.string().optional(),
  hs_deal_stage_probability: z.number().optional(),
  hubspot_owner_id: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export type HubspotDeal = z.infer<typeof HubspotDealSchema>;

/**
 * HubSpot Company Schema (from PostHog data warehouse)
 */
export const HubspotCompanySchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  numberofemployees: z.number().optional(),
  createdate: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  properties: z.record(z.unknown()).optional(),
});

export type HubspotCompany = z.infer<typeof HubspotCompanySchema>;

/**
 * HogQL Query Result Schema (generic)
 */
export const HogQLQueryResultSchema = z.object({
  results: z.array(z.record(z.unknown())),
  columns: z.array(z.string()).optional(),
  types: z.array(z.string()).optional(),
  hasMore: z.boolean().optional(),
});

export type HogQLQueryResult = z.infer<typeof HogQLQueryResultSchema>;

/**
 * Time Window Schema for configurable date ranges with comparison periods
 */
export const TimeWindowSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  comparisonPeriods: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      })
    )
    .optional()
    .default([]),
});

export type TimeWindow = z.infer<typeof TimeWindowSchema>;

/**
 * Metric Value Schema with comparisons
 */
export const MetricValueSchema = z.object({
  value: z.number(),
  label: z.string(),
  change: z.number().optional(), // Percentage change
  changeLabel: z.string().optional(),
});

export type MetricValue = z.infer<typeof MetricValueSchema>;

/**
 * Metric Card Data Schema
 */
export const MetricCardDataSchema = z.object({
  title: z.string(),
  currentValue: z.number(),
  unit: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]),
  trendPercentage: z.number().optional(),
  comparisonValues: z.array(MetricValueSchema).optional(),
  chartData: z.array(z.record(z.unknown())).optional(),
});

export type MetricCardData = z.infer<typeof MetricCardDataSchema>;

/**
 * Product Metrics Schema
 */
export const ProductMetricsSchema = z.object({
  product: z.enum(["boreal", "moosestack"]),
  timeWindow: TimeWindowSchema,
  dau: z.number(),
  mau: z.number(),
  conversionRate: z.number(),
  engagementScore: z.number(),
  specificMetrics: z.record(z.number()).optional(),
  chartData: z.array(z.record(z.unknown())).optional(),
});

export type ProductMetrics = z.infer<typeof ProductMetricsSchema>;

/**
 * Journey Definition Schema
 */
export const JourneyDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  product: z.enum(["boreal", "moosestack"]),
  events: z.array(z.string()),
  expectedDuration: z.string().optional(),
  successCriteria: z.string().optional(),
});

export type JourneyDefinition = z.infer<typeof JourneyDefinitionSchema>;

/**
 * Journey Step Metrics Schema
 */
export const JourneyStepMetricsSchema = z.object({
  eventName: z.string(),
  eventLabel: z.string(),
  userCount: z.number(),
  completionRate: z.number(),
  dropOffRate: z.number(),
  avgTimeFromPrevious: z.number().optional(), // in seconds
});

export type JourneyStepMetrics = z.infer<typeof JourneyStepMetricsSchema>;

/**
 * Journey Metrics Schema
 */
export const JourneyMetricsSchema = z.object({
  journeyId: z.string(),
  journeyName: z.string(),
  product: z.enum(["boreal", "moosestack"]),
  timeWindow: TimeWindowSchema,
  totalStarted: z.number(),
  totalCompleted: z.number(),
  completionRate: z.number(),
  avgTimeToComplete: z.number().optional(), // in seconds
  steps: z.array(JourneyStepMetricsSchema),
});

export type JourneyMetrics = z.infer<typeof JourneyMetricsSchema>;

/**
 * Overview Metrics Schema
 */
export const OverviewMetricsSchema = z.object({
  timeWindow: TimeWindowSchema,
  totalUsers: z.number(),
  totalActiveUsers: z.number(),
  totalEvents: z.number(),
  productsMetrics: z.object({
    boreal: z.object({
      dau: z.number(),
      mau: z.number(),
    }),
    moosestack: z.object({
      dau: z.number(),
      mau: z.number(),
    }),
  }),
  topJourneys: z.array(
    z.object({
      journeyId: z.string(),
      journeyName: z.string(),
      completionRate: z.number(),
    })
  ),
});

export type OverviewMetrics = z.infer<typeof OverviewMetricsSchema>;

/**
 * Cumulative Install Data Point Schema
 */
export const CumulativeInstallDataPointSchema = z.object({
  date: z.string(),
  total: z.number(),
  breakdown: z.string(), // cli_name or breakdown value
});

export type CumulativeInstallDataPoint = z.infer<
  typeof CumulativeInstallDataPointSchema
>;

/**
 * Cumulative OSS Install Metrics Schema
 */
export const CumulativeOSSInstallMetricsSchema = z.object({
  timeWindow: TimeWindowSchema,
  totalInstalls: z.number(),
  dataPoints: z.array(CumulativeInstallDataPointSchema),
  breakdownSeries: z.array(
    z.object({
      breakdown: z.string(),
      dataPoints: z.array(
        z.object({
          date: z.string(),
          cumulativeTotal: z.number(),
        })
      ),
      total: z.number(),
    })
  ),
});

export type CumulativeOSSInstallMetrics = z.infer<
  typeof CumulativeOSSInstallMetricsSchema
>;

/**
 * Project Data Point Schema
 */
export const ProjectDataPointSchema = z.object({
  date: z.string(),
  total: z.number(),
  breakdown: z.string(), // org_id or breakdown value
});

export type ProjectDataPoint = z.infer<typeof ProjectDataPointSchema>;

/**
 * Cumulative Projects Per Organization Metrics Schema
 */
export const CumulativeProjectsMetricsSchema = z.object({
  timeWindow: TimeWindowSchema,
  totalProjects: z.number(),
  totalOrganizations: z.number(),
  dataPoints: z.array(ProjectDataPointSchema),
  breakdownSeries: z.array(
    z.object({
      breakdown: z.string(),
      dataPoints: z.array(
        z.object({
          date: z.string(),
          cumulativeTotal: z.number(),
        })
      ),
      total: z.number(),
    })
  ),
});

export type CumulativeProjectsMetrics = z.infer<
  typeof CumulativeProjectsMetricsSchema
>;

/**
 * Deployment Data Point Schema
 */
export const DeploymentDataPointSchema = z.object({
  date: z.string(),
  total: z.number(),
  breakdown: z.string(), // org_id or breakdown value
});

export type DeploymentDataPoint = z.infer<typeof DeploymentDataPointSchema>;

/**
 * Cumulative Deployments Per Organization Metrics Schema
 */
export const CumulativeDeploymentsMetricsSchema = z.object({
  timeWindow: TimeWindowSchema,
  totalDeployments: z.number(),
  totalOrganizations: z.number(),
  dataPoints: z.array(DeploymentDataPointSchema),
  breakdownSeries: z.array(
    z.object({
      breakdown: z.string(),
      dataPoints: z.array(
        z.object({
          date: z.string(),
          cumulativeTotal: z.number(),
        })
      ),
      total: z.number(),
    })
  ),
});

export type CumulativeDeploymentsMetrics = z.infer<
  typeof CumulativeDeploymentsMetricsSchema
>;
