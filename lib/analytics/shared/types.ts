/**
 * Shared types and interfaces for the analytics integration layer
 */

import { z } from "zod";

/**
 * Standard query options for filtering, pagination, and sorting
 */
export const QueryOptionsSchema = z.object({
  // Pagination
  limit: z.number().min(1).max(1000).optional().default(100),
  offset: z.number().min(0).optional().default(0),

  // Date range filtering
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),

  // Filtering
  filters: z.record(z.unknown()).optional(),

  // Sorting
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),

  // Search
  search: z.string().optional(),
});

export type QueryOptions = z.infer<typeof QueryOptionsSchema>;

/**
 * Standard API response wrapper for consistent response format
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
    hasMore?: boolean;
    [key: string]: unknown;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Base interface for all analytics clients
 */
export interface AnalyticsClient {
  /**
   * Test connection to the service
   */
  healthCheck(): Promise<boolean>;

  /**
   * Get client name/identifier
   */
  getName(): string;
}

/**
 * Pagination metadata helper
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Helper function to create pagination metadata
 */
export function createPaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginationMeta {
  return {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Helper function to create success response
 */
export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>["meta"]
): ApiResponse<T> {
  return { data, meta };
}

/**
 * Helper function to create error response
 */
export function createErrorResponse<T = never>(
  code: string,
  message: string,
  details?: unknown
): ApiResponse<T> {
  return {
    data: null as T,
    error: { code, message, details },
  };
}
