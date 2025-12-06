import { test, expect } from '@playwright/test';
import { loginViaAuthApi } from './utils/supabase-test-helper';

test.describe('Health Signals', () => {
  const GOD_EMAIL = process.env.TEST_GOD_EMAIL || 'god@example.com';
  const GOD_PASSWORD = process.env.TEST_GOD_PASSWORD || 'password';

  test('Org Health Badges Visible', async ({ page }) => {
    await loginViaAuthApi(page, GOD_EMAIL, GOD_PASSWORD);

    await page.goto('/dashboard-dikshithpodhila-god/orgs');
    
    // Check for health column / badges indicator
    await expect(page.getByText('Status / Health')).toBeVisible();
    
    // If we have specific classes for badges:
    // await expect(page.locator('.badge-health-good')).toBeVisible();
  });
});
