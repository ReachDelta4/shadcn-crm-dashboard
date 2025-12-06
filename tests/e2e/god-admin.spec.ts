import { test, expect } from '@playwright/test';
import { loginViaAuthApi } from './utils/supabase-test-helper';

test.describe('God Admin Flows', () => {
  // We need a way to login as God. 
  // If we can't dynamically create a God user, we might need to use a fixed one or mock.
  // For this "Rugged" test, let's assume we can login. 
  // Since I don't know exactly how "God" is determined (likely DB role or metadata), 
  // I will write the test assuming we have a valid God user credential or can create one.
  // If `requireGod` checks `user_metadata.role === 'god'`, we need to set that.
  
  // Placeholder for God credentials - ideally these come from env or are created.
  // For now, I'll use a placeholder and we might fail if not set up.
  const GOD_EMAIL = process.env.TEST_GOD_EMAIL || 'god@example.com';
  const GOD_PASSWORD = process.env.TEST_GOD_PASSWORD || 'password';

  test('God Login and Dashboard Access', async ({ page }) => {
    // Establish a real Supabase session via Auth API + /auth/callback bridge
    await loginViaAuthApi(page, GOD_EMAIL, GOD_PASSWORD);

    // Navigate to God Dashboard (protected by requireGod)
    await page.goto('/dashboard-dikshithpodhila-god');
    await expect(page.getByText('God Admin Console')).toBeVisible();
  });

  test('God Org List and Filters', async ({ page }) => {
    await loginViaAuthApi(page, GOD_EMAIL, GOD_PASSWORD);

    await page.goto('/dashboard-dikshithpodhila-god/orgs');
    
    // Check for filters (search + health toggles)
    await expect(page.getByPlaceholder('Search by name, slug, or plan')).toBeVisible();
    await expect(page.getByRole('button', { name: /Expired/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Expiring/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Over seats/i })).toBeVisible();
  });
});
