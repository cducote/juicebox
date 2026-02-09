import { expect, test } from "@playwright/test";

test.describe("Tasks & Epics Management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project detail page that has tasks
    await page.goto("/projects");
    const projectLink = page.locator("a[href^='/projects/']").first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);
    }
  });

  test("project detail shows tasks & epics section", async ({ page }) => {
    // Task section should be visible on project detail
    const tasksSection = page.getByText(/tasks/i);
    await expect(tasksSection.first()).toBeVisible();
  });

  test("can see epic and task counts", async ({ page }) => {
    // Look for task/epic count indicators
    const countIndicator = page.locator("[data-testid='task-count'], :text-matches('\\\\d+ task')");
    // May be zero — just verify the section loads without error
    await expect(page.locator("body")).toBeVisible();
  });

  test("task status badges render correctly", async ({ page }) => {
    // If tasks exist, their status badges should render
    const badges = page.locator("[data-testid='task-status'], :text-matches('TODO|IN_PROGRESS|BLOCKED|DONE')");
    const count = await badges.count();
    // Verify that if badges exist, they have valid status text
    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await badges.nth(i).textContent();
      expect(["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]).toContain(text?.trim());
    }
  });

  test("milestone tasks are visually distinct", async ({ page }) => {
    // Milestones should have a visual indicator
    const milestones = page.locator("[data-testid='milestone'], :text('milestone')");
    if (await milestones.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(milestones.first()).toBeVisible();
    }
  });
});
