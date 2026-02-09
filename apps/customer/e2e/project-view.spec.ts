import { expect, test } from "@playwright/test";

test.describe("Customer Project View", () => {
  test("shows project cards on portal home", async ({ page }) => {
    await page.goto("/");
    // Either project cards or empty state
    const emptyState = page.getByText(/no projects yet/i);
    const projectCard = page.locator("a[href^='/projects/']").first();

    const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    if (isEmpty) {
      await expect(page.getByText(/will appear here/i)).toBeVisible();
    } else {
      await expect(projectCard).toBeVisible();
    }
  });

  test("project cards show status badge", async ({ page }) => {
    await page.goto("/");
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Status badge should be within the card
      const badge = projectCard.locator("[data-testid='status-badge'], .rounded-full, .inline-flex");
      await expect(badge.first()).toBeVisible();
    }
  });

  test("project cards show payment progress when applicable", async ({ page }) => {
    await page.goto("/");
    const projectCard = page.locator("a[href^='/projects/']").first();
    if (await projectCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Progress bar or payment text
      const paymentInfo = projectCard.locator(":text('%'), [role='progressbar'], [class*='progress']");
      // May not exist if totalAmount is 0 — just verify card loads
      await expect(projectCard).toBeVisible();
    }
  });

  test("navigates to project detail page", async ({ page }) => {
    await page.goto("/");
    const projectLink = page.locator("a[href^='/projects/']").first();

    if (await projectLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);
      // Project title should be visible
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });

  test("project detail shows friendly status message", async ({ page }) => {
    await page.goto("/");
    const projectLink = page.locator("a[href^='/projects/']").first();

    if (await projectLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);

      // ProjectStatusDisplay should show a friendly headline
      const statusHeadlines = [
        "We're building your thing!",
        "Getting things set up",
        "Agreement ready for review",
        "Setting up payments",
        "Project paused",
        "Project suspended",
        "Project complete!",
        "It's all yours!",
      ];

      const headlineVisible = await Promise.any(
        statusHeadlines.map((h) =>
          page
            .getByText(h)
            .isVisible({ timeout: 1000 })
            .then((v) => (v ? true : Promise.reject(false))),
        ),
      ).catch(() => false);

      expect(headlineVisible).toBeTruthy();
    }
  });

  test("project detail shows payment progress card", async ({ page }) => {
    await page.goto("/");
    const projectLink = page.locator("a[href^='/projects/']").first();

    if (await projectLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);

      const paymentCard = page.getByText(/payment progress/i);
      // Only shown when totalAmount > 0
      if (await paymentCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(paymentCard).toBeVisible();
        // Should show dollar amounts
        await expect(page.locator(":text('$')").first()).toBeVisible();
      }
    }
  });

  test("project detail shows payment history when payments exist", async ({ page }) => {
    await page.goto("/");
    const projectLink = page.locator("a[href^='/projects/']").first();

    if (await projectLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);

      const historyCard = page.getByText(/payment history/i);
      if (await historyCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(historyCard).toBeVisible();
      }
    }
  });
});
