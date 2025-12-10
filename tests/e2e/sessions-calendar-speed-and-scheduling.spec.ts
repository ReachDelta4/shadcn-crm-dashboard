import { test, expect } from "@playwright/test";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";

test.describe("Sessions calendar basic navigation (smoke)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E tests",
  );

  test("renders calendar views without crashing", async ({ page }) => {
    await page.goto("/dashboard/sessions/calendar");

    await expect(
      page.getByRole("button", { name: /month/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /week/i }).click();
    await page.getByRole("button", { name: /day/i }).click();
  });
});

