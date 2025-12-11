import { test, expect } from "@playwright/test";
import { loginViaAuthApi } from "./utils/supabase-test-helper";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";
const SLOW_PAGE_TIMEOUT_MS = 60_000;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test-user@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

test.describe("Leads dashboard speed and lifecycle (smoke)", () => {
  test.skip(!RUN_E2E_DASHBOARD, "Set E2E_DASHBOARD=1 to run dashboard E2E tests");

  test("loads leads table and toggles to Kanban without errors", async ({ page }) => {
    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto("/dashboard/leads", { waitUntil: "load" });

    await expect(page.getByRole("heading", { name: /leads/i })).toBeVisible({
      timeout: SLOW_PAGE_TIMEOUT_MS,
    });

    // Table view visible
    await expect(page.getByRole("table")).toBeVisible({
      timeout: SLOW_PAGE_TIMEOUT_MS,
    });

    // Switch to Kanban
    await page.getByRole("tab", { name: /kanban/i }).click();
    await expect(page.getByLabel(/new column/i)).toBeVisible({
      timeout: SLOW_PAGE_TIMEOUT_MS,
    });
  });
});
