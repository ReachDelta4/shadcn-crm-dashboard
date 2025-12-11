import { test, expect } from "@playwright/test";
import { loginViaAuthApi } from "./utils/supabase-test-helper";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";
const SLOW_PAGE_TIMEOUT_MS = 60_000;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test-user@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

test.describe("Sessions calendar basic navigation (smoke)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E tests",
  );

  test("renders calendar views without crashing", async ({ page }) => {
    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto("/dashboard/sessions/calendar", { waitUntil: "load" });

    await expect(
      page.getByRole("button", { name: /month/i }),
    ).toBeVisible({ timeout: SLOW_PAGE_TIMEOUT_MS });

    await page.getByRole("button", { name: /week/i }).click();
    await page.getByRole("button", { name: /day/i }).click();
  });
});
