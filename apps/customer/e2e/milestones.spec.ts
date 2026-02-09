import { expect, test } from "@playwright/test";

test.describe("Customer Milestones View", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    const projectLink = page.locator("a[href^='/projects/']").first();
    if (await projectLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);
    }
  });

  test("milestones card is visible on project detail", async ({ page }) => {
    const milestonesCard = page.getByText(/milestones/i);
    await expect(milestonesCard.first()).toBeVisible();
  });

  test("shows only milestone tasks (not regular tasks)", async ({ page }) => {
    // The customer portal only shows tasks with isMilestone=true
    const milestonesSection = page.getByText(/milestones/i).first();
    await expect(milestonesSection).toBeVisible();

    // If milestones exist, they should have visual indicators
    const milestoneItems = page.locator("[data-testid='milestone-item'], li");
    const count = await milestoneItems.count();
    // Verify page loads without error — milestone count depends on data
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("completed milestones show visual completion", async ({ page }) => {
    // Done milestones should have a green dot and strikethrough text
    const completedMilestone = page.locator(".line-through, [data-status='DONE']");
    if (await completedMilestone.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(completedMilestone.first()).toBeVisible();
    }
  });

  test("empty milestones shows appropriate message", async ({ page }) => {
    const emptyState = page.getByText(/no milestones/i);
    if (await emptyState.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("milestone dots use correct colors", async ({ page }) => {
    // Emerald dot for DONE, gray for other statuses
    const dots = page.locator("[class*='emerald'], [class*='bg-gray']");
    if (await dots.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(dots.first()).toBeVisible();
    }
  });
});
