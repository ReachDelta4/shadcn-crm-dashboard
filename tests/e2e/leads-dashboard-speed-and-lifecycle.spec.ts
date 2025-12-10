import { test, expect } from "@playwright/test";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";

test.describe("Leads dashboard speed and lifecycle (smoke)", () => {
  test.skip(!RUN_E2E_DASHBOARD, "Set E2E_DASHBOARD=1 to run dashboard E2E tests");

  test("loads leads table and toggles to Kanban without errors", async ({ page }) => {
    await page.goto("/dashboard/leads");

    await expect(page.getByRole("heading", { name: /leads/i })).toBeVisible();

    // Table view visible
    await expect(page.getByRole("table")).toBeVisible();

    // Switch to Kanban
    await page.getByRole("tab", { name: /kanban/i }).click();
    await expect(page.getByLabel(/new column/i)).toBeVisible();
  });
});

