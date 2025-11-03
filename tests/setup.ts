import { vi } from 'vitest'

// Ensure required env vars for SSR client creation in route handlers
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'

// Provide a very small fetch stub to avoid unhandled network calls in background tasks
if (typeof global.fetch === 'undefined') {
  // @ts-ignore
  global.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}) }))
}

// Default mock for next/headers cookies used by createServerClient
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    setAll: () => void 0,
  }),
}))


