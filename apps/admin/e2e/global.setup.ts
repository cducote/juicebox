import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(import.meta.dirname, "../playwright/.clerk/admin-user.json");

setup.describe.configure({ mode: "serial" });

setup("initialize Clerk testing", async () => {
  await clerkSetup();
});

setup("authenticate as admin and save state", async ({ page }) => {
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_ADMIN_USERNAME!,
      password: process.env.E2E_ADMIN_PASSWORD!,
    },
  });

  // Wait for redirect to dashboard after sign-in
  await page.waitForURL("/");
  await page.waitForSelector("text=Dashboard");
  await page.context().storageState({ path: authFile });
});
