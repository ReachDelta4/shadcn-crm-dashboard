import { test, expect } from "@playwright/test";
import { loginViaAuthApi } from "./utils/supabase-test-helper";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";
const SLOW_PAGE_TIMEOUT_MS = 60_000;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test-user@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

test.describe("Overview analytics page (smoke)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E tests",
  );

  test("loads overview metrics for 7 and 30 days", async ({ page }) => {
    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto("/dashboard", { waitUntil: "load" });

    await expect(page.getByText(/analytics/i)).toBeVisible({
      timeout: SLOW_PAGE_TIMEOUT_MS,
    });

    await page.getByRole("button", { name: /last 7 days/i }).click();
    await page.getByRole("button", { name: /last 30 days/i }).click();
  });
});
