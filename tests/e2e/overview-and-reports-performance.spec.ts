import { test, expect } from "@playwright/test";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";

test.describe("Overview analytics page (smoke)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E tests",
  );

  test("loads overview metrics for 7 and 30 days", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByText(/analytics/i)).toBeVisible();

    await page.getByRole("button", { name: /last 7 days/i }).click();
    await page.getByRole("button", { name: /last 30 days/i }).click();
  });
});

