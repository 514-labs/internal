/**
 * Zod schemas for Rippling data structures
 */

import { z } from "zod";

/**
 * Rippling Company Schema
 */
export const CompanySchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string().optional(),
  ein: z.string().optional(),
  address: z
    .object({
      street1: z.string().optional(),
      street2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  foundedDate: z.string().optional(),
});

export type Company = z.infer<typeof CompanySchema>;

/**
 * Rippling Department Schema
 */
export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

export type Department = z.infer<typeof DepartmentSchema>;

/**
 * Rippling Employment Status
 */
export const EmploymentStatusSchema = z.enum([
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
  "ON_LEAVE",
  "PENDING",
]);

export type EmploymentStatus = z.infer<typeof EmploymentStatusSchema>;

/**
 * Rippling Compensation Schema
 */
export const CompensationSchema = z.object({
  salary: z.number().optional(),
  currency: z.string().optional(),
  payPeriod: z.string().optional(),
  effectiveDate: z.string().optional(),
});

export type Compensation = z.infer<typeof CompensationSchema>;

/**
 * Rippling Employee Schema
 */
export const EmployeeSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  preferredName: z.string().optional(),
  email: z.string().email(),
  personalEmail: z.string().email().optional(),
  phone: z.string().optional(),
  status: EmploymentStatusSchema,
  title: z.string().optional(),
  department: DepartmentSchema.optional(),
  departmentId: z.string().optional(),
  manager: z
    .object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
      email: z.string(),
    })
    .optional(),
  managerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  employmentType: z.string().optional(), // FULL_TIME, PART_TIME, CONTRACT, etc.
  location: z
    .object({
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  compensation: CompensationSchema.optional(),
  avatar: z.string().optional(),
  birthDate: z.string().optional(),
  hireDate: z.string().optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;

/**
 * Rippling Query Options
 */
export const RipplingQueryOptionsSchema = z.object({
  limit: z.number().min(1).max(500).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  status: EmploymentStatusSchema.optional(),
  departmentId: z.string().optional(),
  managerId: z.string().optional(),
  search: z.string().optional(),
});

export type RipplingQueryOptions = z.infer<typeof RipplingQueryOptionsSchema>;

/**
 * Rippling API Response wrapper
 */
export const RipplingApiResponseSchema = z.object({
  data: z.unknown(),
  pagination: z
    .object({
      total: z.number(),
      limit: z.number(),
      offset: z.number(),
      hasMore: z.boolean(),
    })
    .optional(),
});

export type RipplingApiResponse = z.infer<typeof RipplingApiResponseSchema>;
