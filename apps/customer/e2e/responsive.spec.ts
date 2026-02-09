import { expect, test } from "@playwright/test";

test.describe("Responsive Design (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("portal home renders without horizontal scroll", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    const scrollWidth = await body.evaluate((el) => el.scrollWidth);
    const clientWidth = await body.evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
  });

  test("header fits within viewport", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header, nav").first();
    if (await header.isVisible()) {
      const box = await header.boundingBox();
      expect(box!.width).toBeLessThanOrEqual(375);
    }
  });

  test("project cards stack vertically on mobile", async ({ page }) => {
    await page.goto("/");
    const cards = page.locator("a[href^='/projects/']");
    const count = await cards.count();

    if (count >= 2) {
      const firstBox = await cards.first().boundingBox();
      const secondBox = await cards.nth(1).boundingBox();
      // Cards should be stacked (second card below first)
      expect(secondBox!.y).toBeGreaterThan(firstBox!.y);
    }
  });

  test("project detail page is readable at 375px", async ({ page }) => {
    await page.goto("/");
    const projectLink = page.locator("a[href^='/projects/']").first();

    if (await projectLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await projectLink.click();
      await page.waitForURL(/\/projects\//);

      // No horizontal overflow
      const scrollWidth = await page.locator("body").evaluate((el) => el.scrollWidth);
      const clientWidth = await page.locator("body").evaluate((el) => el.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);

      // Content should be visible
      await expect(page.getByRole("heading").first()).toBeVisible();
    }
  });

  test("notification bell is accessible on mobile", async ({ page }) => {
    await page.goto("/");
    const bell = page.getByRole("button", { name: /notifications/i });
    await expect(bell).toBeVisible();

    // Should be tappable
    const box = await bell.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(24); // Minimum touch target
    expect(box!.height).toBeGreaterThanOrEqual(24);
  });

  test("sign-in page works on mobile", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto("/sign-in");

    // No horizontal scroll
    const scrollWidth = await page.locator("body").evaluate((el) => el.scrollWidth);
    const clientWidth = await page.locator("body").evaluate((el) => el.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    await context.close();
  });
});
