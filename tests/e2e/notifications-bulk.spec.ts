import { test, expect } from '@playwright/test';
import { loginViaAuthApi } from './utils/supabase-test-helper';

const RUN_E2E = process.env.E2E_NOTIFICATIONS === '1';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'user@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password';

test.describe('Notifications & Bulk transitions', () => {
  test.skip(!RUN_E2E, 'Set E2E_NOTIFICATIONS=1 with a seeded test user and leads to run this suite');

  test('single lead status change shows notification', async ({ page }) => {
    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/dashboard');

    await page.getByText('Leads').click();
    const firstRow = page.getByRole('row').nth(1);
    await firstRow.getByText(/Status/i).click();
    await page.getByRole('option', { name: /Contacted/i }).click();

    await page.getByLabel(/Notifications/i).click();
    await expect(page.getByText(/Status Update/i)).toBeVisible();
  });

  test('bulk transition updates statuses and surfaces success toast', async ({ page }) => {
    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/dashboard');

    await page.getByText('Leads').click();
    await page.getByRole('checkbox', { name: /Select lead/i }).first().check();
    await page.getByRole('checkbox', { name: /Select lead/i }).nth(1).check();

    await page.getByText('Change status to...').click();
    await page.getByRole('option', { name: /Qualified/i }).click();
    await page.getByRole('button', { name: /Apply/i }).click();
    await page.getByRole('button', { name: /Confirm change/i }).click();

    await expect(page.getByText(/Updated/)).toBeVisible();
    await expect(page.getByText(/Qualified/)).toBeVisible();
  });
});
