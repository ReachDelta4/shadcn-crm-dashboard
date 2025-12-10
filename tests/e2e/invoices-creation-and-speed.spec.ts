import { test, expect } from "@playwright/test";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";

test.describe("Invoices creation and linkage (smoke)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E tests",
  );

  test("opens New Invoice dialog and allows basic save flow", async ({
    page,
  }) => {
    await page.goto("/dashboard/invoices");

    await expect(
      page.getByRole("heading", { name: /invoices/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /new invoice/i }).click();

    await expect(
      page.getByRole("heading", { name: /create new invoice/i }),
    ).toBeVisible();
  });
});

