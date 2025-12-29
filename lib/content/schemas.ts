import { z } from "zod";

/**
 * Base schema for all content types
 * Contains common fields shared across handbook, products, services, etc.
 */
export const baseContentSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export type BaseContentFrontmatter = z.infer<typeof baseContentSchema>;

/**
 * Handbook schema - Company information, policies, and guidelines
 */
export const handbookSchema = baseContentSchema.extend({
  category: z
    .enum(["onboarding", "policies", "culture", "benefits", "general"])
    .optional(),
  audience: z.array(z.string()).optional(), // e.g., ["new-hires", "managers"]
});

export type HandbookFrontmatter = z.infer<typeof handbookSchema>;

/**
 * Products schema - Product catalog and documentation
 */
export const productSchema = baseContentSchema.extend({
  status: z.enum(["active", "beta", "deprecated", "planned"]).optional(),
  owners: z.array(z.string()).optional(),
  repository: z.string().url().optional(),
  documentation: z.string().url().optional(),
});

export type ProductFrontmatter = z.infer<typeof productSchema>;

/**
 * Services schema - Service offerings and capabilities
 */
export const serviceSchema = baseContentSchema.extend({
  status: z.enum(["active", "maintenance", "deprecated"]).optional(),
  tier: z.enum(["critical", "standard", "experimental"]).optional(),
  owners: z.array(z.string()).optional(),
  dependencies: z.array(z.string()).optional(),
  sla: z.string().optional(), // e.g., "99.9%"
});

export type ServiceFrontmatter = z.infer<typeof serviceSchema>;

/**
 * Frameworks schema - Mental models, methodologies, and thinking tools
 */
export const frameworkSchema = baseContentSchema.extend({
  category: z
    .enum(["mental-model", "methodology", "process", "principle"])
    .optional(),
  source: z.string().optional(), // e.g., "Amazon", "Google", original author
  applicability: z.array(z.string()).optional(), // e.g., ["strategy", "hiring"]
});

export type FrameworkFrontmatter = z.infer<typeof frameworkSchema>;

/**
 * Decisions schema - Decision logs and architectural decisions (ADRs)
 */
export const decisionSchema = baseContentSchema.extend({
  status: z.enum(["proposed", "accepted", "deprecated", "superseded"]),
  deciders: z.array(z.string()).optional(),
  date: z.coerce.date(), // Required for decisions
  supersededBy: z.string().optional(), // Reference to newer decision
  context: z.string().optional(), // Brief context summary
});

export type DecisionFrontmatter = z.infer<typeof decisionSchema>;

/**
 * Playbooks schema - Step-by-step guides for common workflows
 */
export const playbookSchema = baseContentSchema.extend({
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  duration: z.string().optional(), // e.g., "30 minutes"
  prerequisites: z.array(z.string()).optional(),
  category: z
    .enum(["operations", "engineering", "sales", "support", "general"])
    .optional(),
});

export type PlaybookFrontmatter = z.infer<typeof playbookSchema>;

/**
 * Strategy schema - Company strategy, vision, and roadmap
 */
export const strategySchema = baseContentSchema.extend({
  timeframe: z.string().optional(), // e.g., "Q1 2025", "2025-2027"
  status: z.enum(["draft", "active", "completed", "archived"]).optional(),
  owners: z.array(z.string()).optional(),
  category: z
    .enum(["mission", "vision", "roadmap", "okrs", "initiative", "retrospective", "strategy"])
    .optional(),
});

export type StrategyFrontmatter = z.infer<typeof strategySchema>;

/**
 * Metric source configuration for key results
 * Defines where to fetch the current value for a key result
 */
export const metricSourceSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("posthog"),
    type: z.enum(["dau", "mau", "events", "conversions", "journeyCompletion"]),
    config: z
      .object({
        eventName: z.string().optional(),
        journeyId: z.string().optional(),
        product: z.enum(["boreal", "moosestack"]).optional(),
      })
      .optional(),
  }),
  z.object({
    source: z.literal("linear"),
    type: z.enum(["issuesCompleted", "projectProgress", "initiativeProgress"]),
    config: z
      .object({
        projectId: z.string().optional(),
        initiativeId: z.string().optional(),
        teamId: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    source: z.literal("mercury"),
    type: z.enum(["revenue", "cashBalance", "mrr"]),
    config: z
      .object({
        accountId: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    source: z.literal("hubspot"),
    type: z.enum(["deals", "contacts", "pipelineValue"]),
    config: z
      .object({
        stage: z.string().optional(),
      })
      .optional(),
  }),
  z.object({
    source: z.literal("manual"),
    type: z.literal("value"),
  }),
]);

export type MetricSource = z.infer<typeof metricSourceSchema>;

/**
 * Key Result schema - Individual measurable outcomes for a goal
 */
export const keyResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  target: z.number(),
  baseline: z.number().default(0),
  current: z.number().optional(), // Manual value or override
  unit: z.string().optional(),
  metric: metricSourceSchema.optional(),
  overrideMetric: z.boolean().default(false), // When true, use current instead of fetching
});

export type KeyResult = z.infer<typeof keyResultSchema>;

/**
 * Goals schema - OKR-based goal tracking with key results
 */
export const goalSchema = baseContentSchema.extend({
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  strategicDomain: z.enum([
    "product-development",
    "customer-development",
    "company",    // Anchor company-level goals
    "plm",        // Product-Led Marketing
    "slg",        // Sales-Led Growth
    "awareness",  // Partner-led awareness
    "platform",   // Platform & execution
  ]),
  team: z.string(),
  owner: z.string(),
  timeframe: z.string(),
  progress: z.number().min(0).max(100).optional(), // Manual override
  initiatives: z.array(z.string()).optional(), // Linear initiative IDs
  keyResults: z.array(keyResultSchema).optional(),
});

export type GoalFrontmatter = z.infer<typeof goalSchema>;

/**
 * Content type to schema mapping
 */
export const contentSchemas = {
  handbook: handbookSchema,
  products: productSchema,
  services: serviceSchema,
  frameworks: frameworkSchema,
  decisions: decisionSchema,
  playbooks: playbookSchema,
  strategy: strategySchema,
  goals: goalSchema,
} as const;

export type ContentType = keyof typeof contentSchemas;

/**
 * Infer frontmatter type from content type
 */
export type FrontmatterForType<T extends ContentType> = z.infer<
  (typeof contentSchemas)[T]
>;

