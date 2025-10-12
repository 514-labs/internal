/**
 * Zod schemas for Linear data structures
 */

import { z } from "zod";

/**
 * Linear User Schema
 */
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string().optional(),
  email: z.string().email(),
  avatarUrl: z.string().optional(),
  active: z.boolean(),
  admin: z.boolean().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

/**
 * Linear Issue State Schema
 */
export const IssueStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  type: z.string(),
  position: z.number().optional(),
});

export type IssueState = z.infer<typeof IssueStateSchema>;

/**
 * Linear Issue Label Schema
 */
export const IssueLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  description: z.string().optional(),
});

export type IssueLabel = z.infer<typeof IssueLabelSchema>;

/**
 * Linear Issue Priority
 */
export const IssuePrioritySchema = z.enum(["0", "1", "2", "3", "4"]);
export type IssuePriority = z.infer<typeof IssuePrioritySchema>;

/**
 * Linear Issue Schema
 */
export const IssueSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number().optional(),
  estimate: z.number().optional(),
  state: IssueStateSchema.optional(),
  assignee: UserSchema.optional(),
  creator: UserSchema.optional(),
  labels: z.array(IssueLabelSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  canceledAt: z.string().optional(),
  dueDate: z.string().optional(),
  url: z.string(),
  project: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
  team: z.object({
    id: z.string(),
    name: z.string(),
    key: z.string(),
  }),
});

export type Issue = z.infer<typeof IssueSchema>;

/**
 * Linear Project Status Schema
 */
export const ProjectStatusSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  type: z.string(),
});

export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;

/**
 * Linear Project Schema
 */
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  state: z.string(),
  status: ProjectStatusSchema.optional(),
  lead: UserSchema.optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  canceledAt: z.string().optional(),
  url: z.string(),
  progress: z.number().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;

/**
 * Linear Initiative Schema (Roadmap)
 */
export const InitiativeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  targetDate: z.string().optional(),
  projects: z.array(ProjectSchema).optional(),
});

export type Initiative = z.infer<typeof InitiativeSchema>;

/**
 * Linear Query Options
 */
export const LinearQueryOptionsSchema = z.object({
  limit: z.number().min(1).max(250).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  orderBy: z.string().optional(),
  includeArchived: z.boolean().optional().default(false),
  teamId: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  stateId: z.string().optional(),
  labelId: z.string().optional(),
  search: z.string().optional(),
});

export type LinearQueryOptions = z.infer<typeof LinearQueryOptionsSchema>;
