/**
 * Unit tests for shared types and utilities
 */

import {
  QueryOptionsSchema,
  createPaginationMeta,
  createSuccessResponse,
  createErrorResponse,
  type QueryOptions,
} from "@/lib/analytics/shared/types";

describe("Shared Types", () => {
  describe("QueryOptionsSchema", () => {
    it("should validate valid query options", () => {
      const validOptions = {
        limit: 100,
        offset: 0,
        startDate: "2024-01-01T00:00:00Z",
        endDate: "2024-01-31T23:59:59Z",
        sortBy: "created_at",
        sortOrder: "desc" as const,
      };

      const result = QueryOptionsSchema.safeParse(validOptions);
      expect(result.success).toBe(true);
    });

    it("should apply default values", () => {
      const result = QueryOptionsSchema.parse({});
      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
      expect(result.sortOrder).toBe("desc");
    });

    it("should reject invalid limit", () => {
      const result = QueryOptionsSchema.safeParse({ limit: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject limit over max", () => {
      const result = QueryOptionsSchema.safeParse({ limit: 1001 });
      expect(result.success).toBe(false);
    });

    it("should reject negative offset", () => {
      const result = QueryOptionsSchema.safeParse({ offset: -1 });
      expect(result.success).toBe(false);
    });

    it("should validate datetime strings", () => {
      const result = QueryOptionsSchema.safeParse({
        startDate: "invalid-date",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createPaginationMeta", () => {
    it("should create correct pagination metadata", () => {
      const meta = createPaginationMeta(100, 20, 0);

      expect(meta).toEqual({
        total: 100,
        limit: 20,
        offset: 0,
        hasMore: true,
      });
    });

    it("should set hasMore to false when at end", () => {
      const meta = createPaginationMeta(100, 20, 80);

      expect(meta.hasMore).toBe(false);
    });

    it("should set hasMore to false when on last page", () => {
      const meta = createPaginationMeta(100, 20, 99);

      expect(meta.hasMore).toBe(false);
    });
  });

  describe("createSuccessResponse", () => {
    it("should create response with data and metadata", () => {
      const data = { items: [1, 2, 3] };
      const meta = { total: 3 };

      const response = createSuccessResponse(data, meta);

      expect(response).toEqual({
        data,
        meta,
      });
    });

    it("should create response with data only", () => {
      const data = { items: [] };

      const response = createSuccessResponse(data);

      expect(response).toEqual({
        data,
      });
    });
  });

  describe("createErrorResponse", () => {
    it("should create error response with code and message", () => {
      const response = createErrorResponse("NOT_FOUND", "Resource not found");

      expect(response).toEqual({
        data: null,
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
      });
    });

    it("should include details if provided", () => {
      const details = { resource: "user", id: "123" };
      const response = createErrorResponse("NOT_FOUND", "Not found", details);

      expect(response.error?.details).toEqual(details);
    });
  });
});
