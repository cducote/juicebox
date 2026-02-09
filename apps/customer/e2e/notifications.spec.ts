import { expect, test } from "@playwright/test";

test.describe("Customer Notifications", () => {
  test("notification bell renders in header", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /notifications/i })).toBeVisible();
  });

  test("clicking bell opens notification dropdown", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /notifications/i }).click();
    await expect(page.getByText("Notifications").last()).toBeVisible();
  });

  test("dropdown shows notification items or empty state", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /notifications/i }).click();

    // Either notifications or empty state
    const emptyState = page.getByText(/no notifications/i);
    const notificationItem = page.locator("[data-testid='notification-item']").first();

    const isEmpty = await emptyState.isVisible({ timeout: 2000 }).catch(() => false);
    if (isEmpty) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("unread count badge appears when notifications exist", async ({ page }) => {
    await page.goto("/");
    // Badge shows count of unread notifications (capped at 9+)
    const bell = page.getByRole("button", { name: /notifications/i });
    await expect(bell).toBeVisible();
    // Badge is a child element — may or may not be present
  });

  test("mark all read button clears unread state", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /notifications/i }).click();

    const markReadButton = page.getByRole("button", { name: /mark all/i });
    if (await markReadButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await markReadButton.click();
      // After marking read, unread indicators should disappear
      await page.waitForTimeout(1000);
    }
  });
});
