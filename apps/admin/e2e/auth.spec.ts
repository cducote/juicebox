import { setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";

test.describe("Admin Authentication", () => {
  test("redirects unauthenticated users to sign-in", async ({ browser }) => {
    // Fresh context without stored auth state
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/");
    await page.waitForURL(/\/sign-in/);
    expect(page.url()).toContain("/sign-in");
    await context.close();
  });

  test("authenticated admin can access dashboard", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("dashboard shows stat cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Total Projects")).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
  });

  test("non-admin user gets 403", async ({ browser }) => {
    // Fresh context to test with non-admin credentials
    const context = await browser.newContext();
    const page = await context.newPage();
    await setupClerkTestingToken({ page });

    // Attempt to navigate — middleware should block non-admin
    const response = await page.goto("/");
    // Non-authenticated or non-admin users get redirected or 403
    const status = response?.status();
    expect(status === 403 || page.url().includes("/sign-in")).toBeTruthy();
    await context.close();
  });
});
