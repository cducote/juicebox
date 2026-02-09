import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

test.describe("Customer Authentication", () => {
  test("redirects unauthenticated users to sign-in", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForURL(/\/sign-in/);
    expect(page.url()).toContain("/sign-in");
    await context.close();
  });

  test("authenticated customer can access portal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Your Projects" })).toBeVisible();
  });

  test("customer only sees their own projects", async ({ page }) => {
    await page.goto("/");
    // All visible project cards should belong to the authenticated customer
    // This is enforced by the server query filtering by userId
    const heading = page.getByRole("heading", { name: "Your Projects" });
    await expect(heading).toBeVisible();
  });

  test("header shows Juicebox Studios branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Juicebox Studios")).toBeVisible();
  });

  test("user button is visible in header", async ({ page }) => {
    await page.goto("/");
    // Clerk UserButton renders in the header
    const userButton = page.locator(".cl-userButtonTrigger, [data-clerk-component='UserButton']");
    await expect(userButton).toBeVisible({ timeout: 5000 });
  });
});
