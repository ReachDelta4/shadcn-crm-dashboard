import { test, expect } from '@playwright/test';
import { loginViaAuthApi } from './utils/supabase-test-helper';
import { isInbucketAvailable, waitForConfirmationLinkInbucket } from './utils/email-inbox-helper';

const RUN_E2E_AUTH = process.env.E2E_AUTH === '1';

test.describe('Auth email confirmation and password reset (happy paths)', () => {
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test-user@example.com';
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

  test('login page renders and offers signup / forgot password affordances', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    await expect(page.getByText(/create an account/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot your password/i })).toBeVisible();
  });

  test('unauthenticated users are redirected from dashboard to login', async ({ page }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('existing confirmed user can login via auth bridge and reach dashboard', async ({ page }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    await loginViaAuthApi(page, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await page.goto('/dashboard');

    await expect(page.getByText(/overview/i)).toBeVisible();
  });

  test('forgot password flow shows non-enumerating confirmation state', async ({ page }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    await page.goto('/forgot-password');

    const email = `nonexistent-${Date.now()}@example.com`;

    await page.getByLabel(/email/i).fill(email);
    await page.getByRole('button', { name: /send reset link/i }).click();

    await expect(page.getByText(/if there's an account for/i)).toBeVisible();
    await expect(page.getByText(/may take a few minutes/i)).toBeVisible();
  });

  test('reset password page shows expired state without recovery session', async ({ page }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    await page.goto('/reset-password');

    await expect(page.getByText(/reset link expired/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /request new reset link/i })).toBeVisible();
  });

  test('verify email page renders guidance for confirming email', async ({ page }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    const email = `new-user-${Date.now()}@example.com`;
    await page.goto(`/verify-email?email=${encodeURIComponent(email)}`);

    await expect(page.getByText(/confirm your email/i)).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole('button', { name: /i’ve confirmed my email/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /resend confirmation email/i })).toBeVisible();
  });

  test('auth confirm page shows error state without a valid session', async ({ page }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    await page.goto('/auth/confirm');

    await expect(page.getByText(/link expired or invalid/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send me a new confirmation email/i })).toBeVisible();
  });

  test('self-serve signup and email confirmation via Inbucket inbox', async ({ page, request }) => {
    test.skip(!RUN_E2E_AUTH, 'Set E2E_AUTH=1 to run full auth flow tests');

    const inboxAvailable = await isInbucketAvailable(request);
    test.skip(!inboxAvailable, 'Inbucket inbox not reachable; ensure Supabase local dev email server is running');

    const unique = Date.now();
    const email = `signup-e2e-${unique}@example.com`;
    const password = 'TestPassword123!';

    // 1) Perform signup via the login page
    await page.goto('/login?mode=signup');
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/^password$/i).fill(password);
    await page.getByLabel(/confirm password/i).fill(password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Expect to be redirected to verify-email gate
    await expect(page.getByText(/confirm your email/i)).toBeVisible();

    // 2) Poll the real inbox (Inbucket) for the confirmation link
    const confirmUrl = await waitForConfirmationLinkInbucket(request, email, {
      timeoutMs: 60_000,
      pollIntervalMs: 2_000,
      subjectIncludes: 'Confirm',
    });

    // 3) Visit the confirmation link and ensure the app sees the user as confirmed
    await page.goto(confirmUrl);
    await expect(page.getByText(/email confirmed/i)).toBeVisible();
    await page.getByRole('button', { name: /go to dashboard/i }).click();

    // 4) Dashboard should be accessible because email is now confirmed
    await expect(page.getByText(/overview/i)).toBeVisible();
  });
});
