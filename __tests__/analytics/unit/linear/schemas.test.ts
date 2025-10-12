/**
 * Unit tests for Linear schemas
 */

import {
  UserSchema,
  IssueSchema,
  ProjectSchema,
  InitiativeSchema,
  LinearQueryOptionsSchema,
} from "@/lib/analytics/linear/schemas";

describe("Linear Schemas", () => {
  describe("UserSchema", () => {
    it("should validate valid user", () => {
      const user = {
        id: "user_123",
        name: "John Doe",
        displayName: "John",
        email: "john@example.com",
        avatarUrl: "https://example.com/avatar.jpg",
        active: true,
        admin: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      };

      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const user = {
        id: "user_123",
        name: "John Doe",
        email: "invalid-email",
        active: true,
        createdAt: "2024-01-01T00:00:00Z",
      };

      const result = UserSchema.safeParse(user);
      expect(result.success).toBe(false);
    });
  });

  describe("IssueSchema", () => {
    it("should validate complete issue", () => {
      const issue = {
        id: "issue_123",
        identifier: "TEST-1",
        title: "Test Issue",
        description: "Description",
        priority: 1,
        estimate: 3,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
        url: "https://linear.app/test/issue/TEST-1",
        team: {
          id: "team_1",
          name: "Test Team",
          key: "TEST",
        },
      };

      const result = IssueSchema.safeParse(issue);
      expect(result.success).toBe(true);
    });
  });

  describe("ProjectSchema", () => {
    it("should validate project", () => {
      const project = {
        id: "project_123",
        name: "Test Project",
        state: "started",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
        url: "https://linear.app/test/project/123",
      };

      const result = ProjectSchema.safeParse(project);
      expect(result.success).toBe(true);
    });
  });

  describe("InitiativeSchema", () => {
    it("should validate initiative", () => {
      const initiative = {
        id: "init_123",
        name: "Q1 2024",
        sortOrder: 1,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      };

      const result = InitiativeSchema.safeParse(initiative);
      expect(result.success).toBe(true);
    });
  });

  describe("LinearQueryOptionsSchema", () => {
    it("should validate query options", () => {
      const options = {
        limit: 25,
        teamId: "team_123",
        search: "bug",
      };

      const result = LinearQueryOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = LinearQueryOptionsSchema.parse({});

      expect(result.limit).toBe(50);
      expect(result.offset).toBe(0);
      expect(result.includeArchived).toBe(false);
    });

    it("should reject limit over 250", () => {
      const result = LinearQueryOptionsSchema.safeParse({ limit: 300 });

      expect(result.success).toBe(false);
    });
  });
});
