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
    .enum(["mission", "vision", "roadmap", "okrs", "initiative", "retrospective"])
    .optional(),
});

export type StrategyFrontmatter = z.infer<typeof strategySchema>;

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
} as const;

export type ContentType = keyof typeof contentSchemas;

/**
 * Infer frontmatter type from content type
 */
export type FrontmatterForType<T extends ContentType> = z.infer<
  (typeof contentSchemas)[T]
>;

