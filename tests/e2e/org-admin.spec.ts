import { test, expect } from '@playwright/test';
import { loginViaAuthApi } from './utils/supabase-test-helper';

test.describe('Org Admin Flows', () => {
  const ORG_ADMIN_EMAIL = process.env.TEST_ORG_ADMIN_EMAIL || 'admin@example.com';
  const ORG_ADMIN_PASSWORD = process.env.TEST_ORG_ADMIN_PASSWORD || 'password';

  test('Org Admin Login and Summary', async ({ page }) => {
    await loginViaAuthApi(page, ORG_ADMIN_EMAIL, ORG_ADMIN_PASSWORD);

    // Go directly to org settings page guarded by org-admin checks
    await page.goto('/dashboard/settings/org');

    // Verify Org Admin specific elements
    await expect(page.getByRole('heading', { name: 'Org Settings' })).toBeVisible();
    
    // Check that core summary sections are present
    await expect(page.getByText('Plan, license, seats, and invites for your organization.')).toBeVisible();
  });

  test('Org Admin Users & Permissions', async ({ page }) => {
    await loginViaAuthApi(page, ORG_ADMIN_EMAIL, ORG_ADMIN_PASSWORD);

    await page.goto('/dashboard/settings/users');
    
    // Check Users & Permissions header and CSV import skeleton
    await expect(page.getByRole('heading', { name: 'Users & Permissions' })).toBeVisible();
    await expect(page.getByText('CSV Import (skeleton)')).toBeVisible();
    await expect(page.getByText('Upload a CSV with columns')).toBeVisible();
  });
});
