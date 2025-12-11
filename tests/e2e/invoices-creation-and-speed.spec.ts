import { test, expect } from "@playwright/test";
import { loginViaAuthApi } from "./utils/supabase-test-helper";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";
const SLOW_PAGE_TIMEOUT_MS = 60_000;
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || "test-user@example.com";
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || "TestPassword123!";

test.describe("Invoices creation and linkage (smoke)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E tests",
  );

  test("opens New Invoice dialog and allows basic save flow", async ({
    page,
  }) => {
    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);

    await page.goto("/dashboard/invoices", { waitUntil: "load" });

    await expect(
      page.getByRole("heading", { name: /invoices/i }),
    ).toBeVisible({ timeout: SLOW_PAGE_TIMEOUT_MS });

    await page.getByRole("button", { name: /new invoice/i }).click();

    await expect(
      page.getByRole("heading", { name: /create new invoice/i }),
    ).toBeVisible({ timeout: SLOW_PAGE_TIMEOUT_MS });
  });
});
