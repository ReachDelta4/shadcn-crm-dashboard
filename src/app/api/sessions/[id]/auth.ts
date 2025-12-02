import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getSupabaseUser(request: NextRequest) {
  const cookieStore = await import('next/headers').then(m => m.cookies())

  // Primary: cookie-based session
  const supabaseCookie = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
    },
  })
  const { data: { user }, error } = await supabaseCookie.auth.getUser()
  if (user) return { supabase: supabaseCookie as any, user }

  // Fallback: Authorization bearer token
  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (token) {
    const supabaseBearer = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user: bearerUser } } = await supabaseBearer.auth.getUser()
    if (bearerUser) return { supabase: supabaseBearer as any, user: bearerUser }
  }

  return { supabase: supabaseCookie as any, user: null, error: error || new Error('Unauthorized') }
}
