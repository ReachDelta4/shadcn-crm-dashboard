export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/server/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as any
    const { event, session } = body || {}

    const cookieStore = await cookies()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) return new Response('Supabase env not configured', { status: 500 })

    const supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, '', { ...options, maxAge: 0 })
        },
      },
    })

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.access_token && session?.refresh_token) {
        // Note: setSession may rotate refresh_token server-side. Clients should not reuse old tokens after this.
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })

        if (event === 'SIGNED_IN' && session.user && supabaseAdmin) {
          await supabaseAdmin
            .from('profiles')
            .upsert({
              id: session.user.id,
              email: session.user.email || '',
              full_name: (session.user.user_metadata as any)?.full_name || session.user.email?.split('@')[0] || 'User',
              avatar_url: (session.user.user_metadata as any)?.avatar_url || null,
            }, {
              onConflict: 'id'
            })
        }
      }
    }

    if (event === 'SIGNED_OUT') {
      await supabase.auth.signOut()
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('Auth callback error:', e)
    return new Response('Auth callback error', { status: 500 })
  }
}
