import { describe, it, expect } from 'vitest';

import { mapAuthError } from '@/utils/auth/mapAuthError';

describe('mapAuthError (login page copy)', () => {
  it('maps invalid credentials to friendly message', () => {
    expect(mapAuthError('Invalid login credentials')).toContain('Email or password is incorrect');
  });

  it('maps unconfirmed email to verify instruction', () => {
    expect(mapAuthError('Email not confirmed')).toContain('verify your email');
  });

  it('maps existing user on signup to gentle guidance', () => {
    expect(mapAuthError('User already registered')).toContain('Try signing in');
  });
});
