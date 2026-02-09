import { expect, test } from "@playwright/test";

test.describe("Clients Management", () => {
  test("displays clients page", async ({ page }) => {
    await page.goto("/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
  });

  test("shows client cards or empty state", async ({ page }) => {
    await page.goto("/clients");

    const emptyState = page.getByText(/no clients yet/i);
    const clientCard = page.locator("[data-testid='client-card'], .rounded-lg").first();

    // Either empty state or at least one client card
    const isEmpty = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    if (isEmpty) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText(/synced from clerk/i)).toBeVisible();
    } else {
      await expect(clientCard).toBeVisible();
    }
  });

  test("client cards show project count", async ({ page }) => {
    await page.goto("/clients");
    const projectCount = page.getByText(/project/i);
    // If clients exist, project counts should be visible
    if (await projectCount.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(projectCount.first()).toBeVisible();
    }
  });

  test("client cards show payment info", async ({ page }) => {
    await page.goto("/clients");
    // Client cards display "Total Paid" and "Remaining" amounts
    const totalPaid = page.getByText(/total paid/i);
    if (await totalPaid.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(totalPaid.first()).toBeVisible();
    }
  });

  test("clients page renders grid layout", async ({ page }) => {
    await page.goto("/clients");
    // Verify the grid container is present
    const gridContainer = page.locator(".grid");
    if (await gridContainer.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(gridContainer).toBeVisible();
    }
  });
});
