import { defineConfig, type PlaywrightTestConfig } from "@playwright/test";

/**
 * Shared Playwright config — extended by each app's playwright.config.ts.
 * Keeps timeouts, retries, and reporting consistent across admin + customer.
 */
export function createPlaywrightConfig(
  overrides: Partial<PlaywrightTestConfig> = {},
): PlaywrightTestConfig {
  return defineConfig({
    testDir: "./e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: process.env.CI ? "html" : "list",
    timeout: 30_000,
    expect: { timeout: 5_000 },
    use: {
      trace: "on-first-retry",
      screenshot: "only-on-failure",
      video: "retain-on-failure",
    },
    ...overrides,
  });
}
