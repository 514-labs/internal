/**
 * Tests for PostHog filter utilities
 */

import {
  buildInternalTrafficFilters,
  buildDateRangeFilter,
  buildWhereClause,
  combineFilters,
  formatDateForHogQL,
  buildEventFilter,
} from "@/lib/analytics/posthog/filters";

describe("PostHog Filter Utilities", () => {
  describe("buildInternalTrafficFilters", () => {
    it("should build all default filters", () => {
      const filters = buildInternalTrafficFilters();

      expect(filters).toContain(
        "ifNull(not(match(toString(properties.$host), '^(localhost|127\\.0\\.0\\.1)($|:)')), 1)"
      );
      expect(filters).toContain(
        "notIn(properties.$ip, tuple('131.226.35.186', '64.226.133.85'))"
      );
      expect(filters).toContain(
        "notILike(toString(properties.$pathname), '%/studio%')"
      );
      expect(filters).toContain(
        "notEquals(properties.is_moose_developer, true)"
      );
    });

    it("should respect filter options", () => {
      const filters = buildInternalTrafficFilters({
        excludeLocalhost: false,
        excludeInternalIPs: false,
      });

      expect(filters).not.toContain(
        "ifNull(not(match(toString(properties.$host), '^(localhost|127\\.0\\.0\\.1)($|:)')), 1)"
      );
      expect(filters).not.toContain(
        "notIn(properties.$ip, tuple('131.226.35.186', '64.226.133.85'))"
      );
    });
  });

  describe("buildDateRangeFilter", () => {
    it("should build date range filter with default field", () => {
      const filters = buildDateRangeFilter(
        "2025-01-01 00:00:00",
        "2025-12-31 23:59:59"
      );

      expect(filters).toHaveLength(2);
      expect(filters[0]).toContain("greaterOrEquals(timestamp");
      expect(filters[1]).toContain("lessOrEquals(timestamp");
    });

    it("should build date range filter with custom field", () => {
      const filters = buildDateRangeFilter(
        "2025-01-01 00:00:00",
        "2025-12-31 23:59:59",
        "created_at"
      );

      expect(filters[0]).toContain("greaterOrEquals(created_at");
      expect(filters[1]).toContain("lessOrEquals(created_at");
    });
  });

  describe("combineFilters", () => {
    it("should combine multiple filters with AND", () => {
      const filters = ["filter1", "filter2", "filter3"];
      const result = combineFilters(filters);

      expect(result).toBe("and(filter1, filter2, filter3)");
    });

    it("should return single filter without AND", () => {
      const filters = ["filter1"];
      const result = combineFilters(filters);

      expect(result).toBe("filter1");
    });

    it("should return true for empty array", () => {
      const result = combineFilters([]);

      expect(result).toBe("1 = 1");
    });
  });

  describe("formatDateForHogQL", () => {
    it("should format ISO date to HogQL format", () => {
      const isoDate = "2025-10-13T12:30:45Z";
      const result = formatDateForHogQL(isoDate);

      expect(result).toBe("2025-10-13 12:30:45");
    });

    it("should handle different timezones", () => {
      const isoDate = "2025-01-01T00:00:00.000Z";
      const result = formatDateForHogQL(isoDate);

      expect(result).toBe("2025-01-01 00:00:00");
    });
  });

  describe("buildEventFilter", () => {
    it("should build event filter", () => {
      const result = buildEventFilter("test_event");

      expect(result).toBe("equals(event, 'test_event')");
    });
  });

  describe("buildWhereClause", () => {
    it("should build complete WHERE clause", () => {
      const result = buildWhereClause(
        "2025-01-01 00:00:00",
        "2025-12-31 23:59:59",
        "test_event"
      );

      expect(result).toContain("greaterOrEquals(timestamp");
      expect(result).toContain("lessOrEquals(timestamp");
      expect(result).toContain("equals(event, 'test_event')");
      expect(result).toContain("and(");
    });

    it("should work without event filter", () => {
      const result = buildWhereClause(
        "2025-01-01 00:00:00",
        "2025-12-31 23:59:59"
      );

      expect(result).not.toContain("equals(event");
      expect(result).toContain("greaterOrEquals(timestamp");
    });
  });
});

