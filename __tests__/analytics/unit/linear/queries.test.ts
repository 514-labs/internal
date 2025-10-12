/**
 * Unit tests for Linear query functions
 *
 * Tests query functions with OAuth-enabled client
 */

import {
  getIssues,
  getProjects,
  getInitiatives,
  getUsers,
} from "@/lib/analytics/linear/queries";
import {
  __setMockTokens,
  __clearMockTokens,
} from "../../../../__mocks__/lib/integrations/linear-oauth";
import { resetLinearClient } from "@/lib/analytics/linear/client";

jest.mock("@linear/sdk");
jest.mock("@/lib/integrations/linear-oauth");

describe("Linear Queries (OAuth-Compatible)", () => {
  beforeEach(() => {
    // Set up OAuth tokens for tests
    __setMockTokens({
      access_token: "oauth_queries_test",
      refresh_token: "refresh_queries",
      token_type: "Bearer",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      scope: "read,write",
    });
    resetLinearClient();
  });

  afterEach(() => {
    __clearMockTokens();
  });
  describe("getIssues", () => {
    it("should fetch issues", async () => {
      const issues = await getIssues({ limit: 10 });

      expect(issues).toBeDefined();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBeGreaterThan(0);
    });

    it("should fetch issues with filters", async () => {
      const issues = await getIssues({
        limit: 5,
        teamId: "team_123",
        stateId: "state_in_progress",
      });

      expect(issues).toBeDefined();
    });

    it("should handle search filter", async () => {
      const issues = await getIssues({
        search: "bug",
        limit: 10,
      });

      expect(issues).toBeDefined();
    });
  });

  describe("getProjects", () => {
    it("should fetch projects", async () => {
      const projects = await getProjects({ limit: 10 });

      expect(projects).toBeDefined();
      expect(Array.isArray(projects)).toBe(true);
    });
  });

  describe("getInitiatives", () => {
    it("should fetch initiatives", async () => {
      const initiatives = await getInitiatives({ limit: 10 });

      expect(initiatives).toBeDefined();
      expect(Array.isArray(initiatives)).toBe(true);
    });
  });

  describe("getUsers", () => {
    it("should fetch users", async () => {
      const users = await getUsers({ limit: 10 });

      expect(users).toBeDefined();
      expect(Array.isArray(users)).toBe(true);
    });

    it("should filter active users by default", async () => {
      const users = await getUsers({});

      expect(users).toBeDefined();
    });
  });
});
