/**
 * Mock Linear SDK for testing
 */

export class LinearClient {
  constructor(public config: { apiKey: string }) {}

  get viewer() {
    return Promise.resolve({
      id: "viewer_123",
      name: "Test Viewer",
      email: "viewer@example.com",
    });
  }

  async issues(options?: {
    first?: number;
    filter?: any;
    includeArchived?: boolean;
  }) {
    return {
      nodes: [
        {
          id: "issue_1",
          identifier: "TEST-1",
          title: "Test Issue 1",
          description: "Test description",
          priority: 1,
          estimate: 3,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          completedAt: null,
          canceledAt: null,
          dueDate: null,
          url: "https://linear.app/test/issue/TEST-1",
          state: Promise.resolve({
            id: "state_1",
            name: "In Progress",
            color: "#f2c94c",
            type: "started",
            position: 1,
          }),
          assignee: Promise.resolve({
            id: "user_1",
            name: "Test Assignee",
            displayName: "Test Assignee",
            email: "assignee@example.com",
            avatarUrl: null,
            active: true,
            admin: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          }),
          creator: Promise.resolve({
            id: "user_2",
            name: "Test Creator",
            displayName: "Test Creator",
            email: "creator@example.com",
            avatarUrl: null,
            active: true,
            admin: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          }),
          labels: () =>
            Promise.resolve({
              nodes: [
                {
                  id: "label_1",
                  name: "bug",
                  color: "#eb5757",
                  description: "Bug label",
                },
              ],
            }),
          project: Promise.resolve({
            id: "project_1",
            name: "Test Project",
          }),
          team: Promise.resolve({
            id: "team_1",
            name: "Test Team",
            key: "TEST",
          }),
        },
      ],
    };
  }

  async projects(options?: {
    first?: number;
    filter?: any;
    includeArchived?: boolean;
  }) {
    return {
      nodes: [
        {
          id: "project_1",
          name: "Test Project",
          description: "Test project description",
          icon: null,
          color: "#f2c94c",
          state: "started",
          progress: 0.5,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          completedAt: null,
          canceledAt: null,
          startDate: new Date("2024-01-01"),
          targetDate: new Date("2024-03-01"),
          url: "https://linear.app/test/project/project_1",
          lead: Promise.resolve({
            id: "user_1",
            name: "Project Lead",
            displayName: "Project Lead",
            email: "lead@example.com",
            avatarUrl: null,
            active: true,
            admin: false,
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          }),
        },
      ],
    };
  }

  async initiatives(options?: { first?: number }) {
    return {
      nodes: [
        {
          id: "initiative_1",
          name: "Test Initiative",
          description: "Test initiative description",
          icon: null,
          color: "#6e56cf",
          sortOrder: 1,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          targetDate: new Date("2024-06-01"),
          projects: () =>
            Promise.resolve({
              nodes: [
                {
                  id: "project_1",
                  name: "Test Project",
                  description: "Test project",
                  icon: null,
                  color: "#f2c94c",
                  state: "started",
                  progress: 0.5,
                  createdAt: new Date("2024-01-01"),
                  updatedAt: new Date("2024-01-02"),
                  completedAt: null,
                  canceledAt: null,
                  startDate: new Date("2024-01-01"),
                  targetDate: new Date("2024-03-01"),
                  url: "https://linear.app/test/project/project_1",
                },
              ],
            }),
        },
      ],
    };
  }

  async users(options?: { first?: number; filter?: any }) {
    return {
      nodes: [
        {
          id: "user_1",
          name: "Test User",
          displayName: "Test User",
          email: "test@example.com",
          avatarUrl: null,
          active: true,
          admin: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
      ],
    };
  }
}
