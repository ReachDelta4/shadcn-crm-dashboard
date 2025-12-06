import { request, type Page } from '@playwright/test';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// We might need a service role key for "God" actions if we can't create a god user via normal signup.
// For now, we'll assume we can create a user and then maybe "promote" them if we have DB access, 
// OR we rely on a pre-existing God user if we can't create one.
// However, the prompt implies we should be able to test everything.
// If we can't create a God user easily, we might need to mock the auth or use a known seed.
// Let's try to create a user and see.

export async function createTestUser(role: 'user' | 'god' = 'user') {
  const email = `test-${role}-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  const context = await request.newContext();
  
  // 1. Sign up
  const signupResponse = await context.post(`${SUPABASE_URL}/auth/v1/signup`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY!,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    data: {
      email,
      password,
      data: {
        full_name: `Test ${role} User`
      }
    }
  });

  if (!signupResponse.ok()) {
    throw new Error(`Failed to create user: ${await signupResponse.text()}`);
  }

  const userData = await signupResponse.json();
  let accessToken = userData.access_token;
  const userId = userData.user?.id || userData.id; // Adjust based on actual response structure

  // If we didn't get a token (email confirmation enabled), we might be stuck unless we can auto-confirm.
  // The existing script assumes we might get a token.
  
  // If we need to be GOD, we likely need to update the user's metadata or role in the DB.
  // Since we don't have direct DB access via this helper (only REST), 
  // we might need to rely on a specific email pattern or a pre-seeded admin if the app logic grants God based on email.
  // OR, if we have the SERVICE_ROLE_KEY, we can update the user.
  // Let's check if we have SERVICE_ROLE_KEY in process.env (it might be there for server-side tests).
  
  return { email, password, userId, accessToken };
}

export async function getAuthHeaders(accessToken: string) {
  return {
    'Authorization': `Bearer ${accessToken}`,
    'apikey': SUPABASE_ANON_KEY!
  };
}

/**
 * Authenticate an existing Supabase user via password and
 * synchronize the session into the Playwright browser context
 * using the app's own /auth/callback endpoint.
 *
 * This mirrors the real login flow while avoiding flakiness
 * from client-side routing races.
 */
export async function loginViaAuthApi(page: Page, email: string, password: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase URL or anon key missing in environment');
  }

  const api = await request.newContext();
  try {
    const tokenRes = await api.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      } as Record<string, string>,
      data: {
        email,
        password,
      },
    });

    if (!tokenRes.ok()) {
      const body = await tokenRes.text();
      throw new Error(`Failed to get auth tokens for ${email}: ${tokenRes.status()} ${body}`);
    }

    const json = await tokenRes.json();
    const session = {
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      user: json.user,
    };

    const callbackRes = await page.request.post('/auth/callback', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        event: 'SIGNED_IN',
        session,
      },
    });

    if (!callbackRes.ok()) {
      const body = await callbackRes.text();
      throw new Error(`Failed to sync session via /auth/callback: ${callbackRes.status()} ${body}`);
    }
  } finally {
    await api.dispose();
  }
}
