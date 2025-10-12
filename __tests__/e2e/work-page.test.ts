import { test, expect } from "@playwright/test";

test.describe("Work Page", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the Linear API endpoints to return consistent test data
    await page.route(
      "**/api/analytics/linear/projects?state=started",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: "proj-1",
                name: "Test Project 1",
                description: "A test project",
                state: "started",
                progress: 0.75,
                targetDate: new Date(
                  Date.now() + 7 * 24 * 60 * 60 * 1000
                ).toISOString(),
                url: "https://linear.app/test/project/proj-1",
                icon: "🚀",
                color: "#3b82f6",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: "proj-2",
                name: "Test Project 2",
                description: "Another test project",
                state: "started",
                progress: 0.35,
                targetDate: new Date(
                  Date.now() + 14 * 24 * 60 * 60 * 1000
                ).toISOString(),
                url: "https://linear.app/test/project/proj-2",
                icon: "📱",
                color: "#10b981",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            metadata: {
              total: 2,
              limit: 50,
              offset: 0,
            },
          }),
        });
      }
    );

    await page.route(
      "**/api/analytics/linear/initiatives?status=active",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: "init-1",
                name: "Q1 2025 Initiative",
                description: "Strategic initiative for Q1",
                status: "active",
                icon: "🎯",
                sortOrder: 1,
                targetDate: new Date(
                  Date.now() + 60 * 24 * 60 * 60 * 1000
                ).toISOString(),
                projects: [
                  { id: "proj-1", name: "Project 1" },
                  { id: "proj-2", name: "Project 2" },
                ],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: "init-2",
                name: "Platform Improvements",
                description: "Improving core platform features",
                status: "active",
                icon: "⚡",
                sortOrder: 2,
                targetDate: new Date(
                  Date.now() + 90 * 24 * 60 * 60 * 1000
                ).toISOString(),
                projects: [{ id: "proj-3", name: "Project 3" }],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            metadata: {
              total: 2,
              limit: 50,
              offset: 0,
            },
          }),
        });
      }
    );

    await page.route(
      "**/api/analytics/linear/issues?completed=true&limit=10",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: "issue-1",
                identifier: "ENG-101",
                title: "Implement user authentication",
                state: {
                  id: "state-1",
                  name: "Done",
                  color: "#10b981",
                  type: "completed",
                },
                completedAt: new Date(
                  Date.now() - 2 * 60 * 60 * 1000
                ).toISOString(),
                url: "https://linear.app/test/issue/ENG-101",
                assignee: {
                  id: "user-1",
                  name: "John Doe",
                  displayName: "John Doe",
                  email: "john@example.com",
                  avatarUrl: "https://avatar.example.com/john.jpg",
                  active: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                team: {
                  id: "team-1",
                  name: "Engineering",
                  key: "ENG",
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: "issue-2",
                identifier: "ENG-102",
                title: "Fix responsive layout issues",
                state: {
                  id: "state-1",
                  name: "Done",
                  color: "#10b981",
                  type: "completed",
                },
                completedAt: new Date(
                  Date.now() - 5 * 60 * 60 * 1000
                ).toISOString(),
                url: "https://linear.app/test/issue/ENG-102",
                assignee: {
                  id: "user-2",
                  name: "Jane Smith",
                  displayName: "Jane Smith",
                  email: "jane@example.com",
                  avatarUrl: "https://avatar.example.com/jane.jpg",
                  active: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                team: {
                  id: "team-1",
                  name: "Engineering",
                  key: "ENG",
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
            metadata: {
              total: 2,
              limit: 10,
              offset: 0,
            },
          }),
        });
      }
    );
  });

  test("should load work page successfully", async ({ page }) => {
    await page.goto("/work");

    // Check if the page title is present
    await expect(page.getByRole("heading", { name: "Work" })).toBeVisible();
  });

  test("should display active projects card with correct data", async ({
    page,
  }) => {
    await page.goto("/work");

    // Wait for the Active Projects card to be visible
    await expect(
      page.getByRole("heading", { name: "Active Projects" })
    ).toBeVisible();

    // Check if project names are displayed
    await expect(page.getByText("Test Project 1")).toBeVisible();
    await expect(page.getByText("Test Project 2")).toBeVisible();

    // Check if progress bars are shown (looking for percentage text)
    await expect(page.getByText("75%")).toBeVisible();
    await expect(page.getByText("35%")).toBeVisible();
  });

  test("should display active initiatives card with correct data", async ({
    page,
  }) => {
    await page.goto("/work");

    // Wait for the Active Initiatives card to be visible
    await expect(
      page.getByRole("heading", { name: "Active Initiatives" })
    ).toBeVisible();

    // Check if initiative names are displayed
    await expect(page.getByText("Q1 2025 Initiative")).toBeVisible();
    await expect(page.getByText("Platform Improvements")).toBeVisible();

    // Check if project counts are shown
    await expect(page.getByText("2 projects")).toBeVisible();
    await expect(page.getByText("1 project")).toBeVisible();
  });

  test("should display recently completed issues feed with correct data", async ({
    page,
  }) => {
    await page.goto("/work");

    // Wait for the Recently Completed feed to be visible
    await expect(
      page.getByRole("heading", { name: "Recently Completed" })
    ).toBeVisible();

    // Check if issue identifiers are displayed
    await expect(page.getByText("ENG-101")).toBeVisible();
    await expect(page.getByText("ENG-102")).toBeVisible();

    // Check if issue titles are displayed
    await expect(page.getByText("Implement user authentication")).toBeVisible();
    await expect(page.getByText("Fix responsive layout issues")).toBeVisible();

    // Check if assignee names are displayed
    await expect(page.getByText("John Doe")).toBeVisible();
    await expect(page.getByText("Jane Smith")).toBeVisible();
  });

  test("should have clickable links to Linear", async ({ page }) => {
    await page.goto("/work");

    // Check that project links exist and have correct href
    const projectLink = page
      .locator('a[href*="linear.app/test/project/proj-1"]')
      .first();
    await expect(projectLink).toBeVisible();

    // Check that issue links exist and have correct href
    const issueLink = page
      .locator('a[href*="linear.app/test/issue/ENG-101"]')
      .first();
    await expect(issueLink).toBeVisible();
  });

  test("should handle empty state when no data is available", async ({
    page,
  }) => {
    // Override routes to return empty data
    await page.route(
      "**/api/analytics/linear/projects?state=started",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [],
            metadata: { total: 0, limit: 50, offset: 0 },
          }),
        });
      }
    );

    await page.route(
      "**/api/analytics/linear/initiatives?status=active",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [],
            metadata: { total: 0, limit: 50, offset: 0 },
          }),
        });
      }
    );

    await page.route(
      "**/api/analytics/linear/issues?completed=true&limit=10",
      (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: [],
            metadata: { total: 0, limit: 10, offset: 0 },
          }),
        });
      }
    );

    await page.goto("/work");

    // Check for empty state messages
    await expect(page.getByText("No active projects found")).toBeVisible();
    await expect(page.getByText("No active initiatives found")).toBeVisible();
    await expect(page.getByText("No recently completed issues")).toBeVisible();
  });

  test("should show loading states", async ({ page }) => {
    // Delay the API responses to see loading states
    await page.route("**/api/analytics/linear/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [],
          metadata: { total: 0, limit: 50, offset: 0 },
        }),
      });
    });

    await page.goto("/work");

    // Check that loading skeleton appears
    const loadingElements = page.locator(".animate-pulse");
    await expect(loadingElements.first()).toBeVisible();
  });
});
