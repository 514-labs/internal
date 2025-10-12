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
