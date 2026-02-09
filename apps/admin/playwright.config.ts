import { createPlaywrightConfig } from "@juicebox/config/playwright";
import { devices } from "@playwright/test";

export default createPlaywrightConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.clerk/admin-user.json",
      },
      dependencies: ["setup"],
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
        storageState: "playwright/.clerk/admin-user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
