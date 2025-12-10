import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function createServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Supabase env not configured')

  return createServerClient(url, anon, {
    cookies: {
      // In server components and layouts we only have read access to cookies.
      // We expose getAll so Supabase can read the session, and provide a
      // no-op setAll implementation so that any attempted session writes from
      // this context are ignored instead of trying to mutate Next.js cookies.
      // All real session cookie writes are funneled through route handlers
      // like /auth/callback, where full read/write cookie APIs are allowed.
      async getAll() {
        const all = cookieStore.getAll()
        return all.map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }))
      },
      async setAll() {
        // Intentionally ignore cookie writes in layouts/server components.
      },
    },
  })
}
