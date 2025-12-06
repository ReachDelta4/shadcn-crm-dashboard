import { test, expect } from '@playwright/test';
import { loginViaAuthApi } from './utils/supabase-test-helper';

test.describe('Invite Flows', () => {
  const GOD_EMAIL = process.env.TEST_GOD_EMAIL || 'god@example.com';
  const GOD_PASSWORD = process.env.TEST_GOD_PASSWORD || 'password';

  test('God can create and manage invites', async ({ page }) => {
    await loginViaAuthApi(page, GOD_EMAIL, GOD_PASSWORD);

    // Navigate to org list and locate the dedicated E2E org.
    await page.goto('/dashboard-dikshithpodhila-god/orgs');
    const row = page.getByRole('row', { name: /E2E Enterprise Test Org/ });
    await expect(row).toBeVisible();

    const viewLink = row.getByRole('link', { name: 'View' });
    const href = await viewLink.getAttribute('href');
    expect(href).toBeTruthy();

    const orgId = href!.split('/').filter(Boolean).pop()!;

    // Create invite via the real API (same route the UI uses).
    const uniqueEmail = `invite-${Date.now()}@example.com`;
    const createResponse = await page.request.post(`/api/god/orgs/${orgId}/invites`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        email: uniqueEmail,
        role: 'sales_rep',
        expiresInDays: 14,
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const created = await createResponse.json();
    expect(created.id).toBeTruthy();

    // Open org detail page and verify the invite is visible.
    await page.goto(href!);
    const emailCell = page.getByRole('cell', { name: uniqueEmail });
    await expect(emailCell).toBeVisible();

    // For now we only assert creation via API + UI.
    // Revoke / extend / resend flows are covered by the API route
    // and lower-level tests, and will be exercised in a later hardening pass.
  });
});
