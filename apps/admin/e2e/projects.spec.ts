import { expect, test } from "@playwright/test";

test.describe("Projects Management", () => {
  test("displays projects list page", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("shows New Project button", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByRole("link", { name: /new project/i })).toBeVisible();
  });

  test("navigates to new project form", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: /new project/i }).click();
    await page.waitForURL("/projects/new");
    await expect(page.getByRole("heading", { name: "New Project" })).toBeVisible();
  });

  test("new project form has required fields", async ({ page }) => {
    await page.goto("/projects/new");
    await expect(page.getByLabel(/title/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
    await expect(page.getByLabel(/client/i)).toBeVisible();
    await expect(page.getByLabel(/deal type/i)).toBeVisible();
    await expect(page.getByLabel(/total amount/i)).toBeVisible();
    await expect(page.getByLabel(/term/i)).toBeVisible();
    await expect(page.getByLabel(/grace period/i)).toBeVisible();
  });

  test("can create a new project", async ({ page }) => {
    await page.goto("/projects/new");

    await page.getByLabel(/title/i).fill("E2E Test Project");
    await page.getByLabel(/description/i).fill("Created by Playwright");
    await page.getByLabel(/total amount/i).fill("500000");
    await page.getByLabel(/term/i).fill("12");
    await page.getByRole("button", { name: /create project/i }).click();

    // Should redirect to the project detail or projects list
    await page.waitForURL(/\/projects/);
    await expect(page.getByText("E2E Test Project")).toBeVisible();
  });

  test("can view project detail page", async ({ page }) => {
    await page.goto("/projects");

    // Click the first project card if it exists
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible()) {
      await projectCard.click();
      // Project detail page should show title and status
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });

  test("project detail shows status pipeline", async ({ page }) => {
    await page.goto("/projects");
    const projectCard = page.locator("a[href^='/projects/']").first();

    if (await projectCard.isVisible()) {
      await projectCard.click();
      // Status pipeline steps should be visible
      await expect(page.getByText("PLANNING")).toBeVisible();
    }
  });

  test("can navigate to project settings", async ({ page }) => {
    await page.goto("/projects");
    const projectCard = page.locator("a[href^='/projects/']").first();

    if (await projectCard.isVisible()) {
      await projectCard.click();
      await page.getByRole("link", { name: /settings/i }).click();
      await expect(page.getByText(/settings & overrides/i)).toBeVisible();
    }
  });
});
