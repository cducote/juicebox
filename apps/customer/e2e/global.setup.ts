import { clerk, clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import path from "path";

const authFile = path.join(import.meta.dirname, "../playwright/.clerk/customer-user.json");

setup.describe.configure({ mode: "serial" });

setup("initialize Clerk testing", async () => {
  await clerkSetup();
});

setup("authenticate as customer and save state", async ({ page }) => {
  await page.goto("/sign-in");
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "password",
      identifier: process.env.E2E_CUSTOMER_USERNAME!,
      password: process.env.E2E_CUSTOMER_PASSWORD!,
    },
  });

  // Wait for redirect to customer portal after sign-in
  await page.waitForURL("/");
  await page.waitForSelector("text=Your Projects");
  await page.context().storageState({ path: authFile });
});
