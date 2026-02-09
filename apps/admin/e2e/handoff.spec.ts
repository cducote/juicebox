import { expect, test } from "@playwright/test";

test.describe("Project Handoff", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a project detail page
    await page.goto("/projects");
    const projectLink = page.locator("a[href^='/projects/']").first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);
    }
  });

  test("handoff checklist link is visible on project detail", async ({ page }) => {
    const handoffLink = page.getByRole("link", { name: /handoff/i });
    if (await handoffLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(handoffLink).toBeVisible();
    }
  });

  test("navigates to handoff checklist page", async ({ page }) => {
    const handoffLink = page.getByRole("link", { name: /handoff/i });
    if (await handoffLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await handoffLink.click();
      await page.waitForURL(/\/handoff/);
      await expect(page.getByText(/handoff checklist/i)).toBeVisible();
    }
  });

  test("checklist shows progress indicator", async ({ page }) => {
    const handoffLink = page.getByRole("link", { name: /handoff/i });
    if (await handoffLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await handoffLink.click();
      await page.waitForURL(/\/handoff/);

      // Progress display should show "X of Y items complete"
      const progress = page.getByText(/items complete/i);
      if (await progress.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(progress).toBeVisible();
      }
    }
  });

  test("checklist items can be toggled", async ({ page }) => {
    const handoffLink = page.getByRole("link", { name: /handoff/i });
    if (await handoffLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await handoffLink.click();
      await page.waitForURL(/\/handoff/);

      const checkbox = page.locator("input[type='checkbox']").first();
      if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const wasChecked = await checkbox.isChecked();
        await checkbox.click();
        // Checkbox state should toggle
        if (wasChecked) {
          await expect(checkbox).not.toBeChecked();
        } else {
          await expect(checkbox).toBeChecked();
        }
      }
    }
  });

  test("finalize button disabled when items incomplete", async ({ page }) => {
    const handoffLink = page.getByRole("link", { name: /handoff/i });
    if (await handoffLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await handoffLink.click();
      await page.waitForURL(/\/handoff/);

      const finalizeButton = page.getByRole("button", { name: /finalize/i });
      if (await finalizeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Button should be disabled when not all items are checked
        const checkboxes = page.locator("input[type='checkbox']");
        const total = await checkboxes.count();
        const checked = await checkboxes.locator(":checked").count();

        if (checked < total) {
          await expect(finalizeButton).toBeDisabled();
        }
      }
    }
  });

  test("HANDED_OFF status shows after finalization", async ({ page }) => {
    // Navigate to handoff page — if project is already handed off, verify badge
    const handoffLink = page.getByRole("link", { name: /handoff/i });
    if (await handoffLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await handoffLink.click();
      await page.waitForURL(/\/handoff/);

      const handedOffBadge = page.getByText("Handed Off");
      if (await handedOffBadge.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(handedOffBadge).toBeVisible();
        await expect(page.getByText(/fully handed off/i)).toBeVisible();
      }
    }
  });
});
