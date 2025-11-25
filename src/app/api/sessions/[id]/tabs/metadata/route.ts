import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { SessionsRepository } from '@/server/repositories/sessions'

async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const repo = new ReportsV3TabsRepository(supabase as any)
    const row = await repo.findBySessionId(id, user.id)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const r: any = row.report || {}
    let meta: any = (r?.schema_version === 'tabs_json_v1') ? (r.meta || null) : null
    const scores: any = (r?.schema_version === 'tabs_json_v1') ? (r.scores || null) : null

    // Fallback: compute minimal call metadata if absent so UI can always render the top card
    if (!meta) {
      try {
        const sessionsRepo = new SessionsRepository(supabase as any)
        const s = await sessionsRepo.findById(id, user.id)
        if (s) {
          const durationSecs = (() => {
            if (!s.started_at || !s.ended_at) return null
            try { return Math.max(0, Math.floor((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime())/1000)) } catch { return null }
          })()
          meta = {
            session_id: s.id,
            subject_id: s.subject_id || null,
            title: s.title || null,
            started_at: s.started_at || null,
            ended_at: s.ended_at || null,
            duration_secs: durationSecs,
            stage: r?.meta?.stage || null,
            channel: r?.meta?.channel || null,
            one_line_summary: r?.meta?.one_line_summary || null,
          }
        }
      } catch {}
    }

    return NextResponse.json({ session_id: row.session_id, status: row.status, attempts: row.attempts, meta, scores })
  } catch (error) {
    console.error('[tabs/metadata] GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
