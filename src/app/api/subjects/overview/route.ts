import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const subjectsLimit = Math.min(Math.max(parseInt(url.searchParams.get('subjects') || '12', 10) || 12, 1), 50)
    const sessionsPerSubject = Math.min(Math.max(parseInt(url.searchParams.get('sessions') || '5', 10) || 5, 1), 10)
    const fetchLimit = Math.min(subjectsLimit * sessionsPerSubject * 4, 2000)

    // Fetch recent sessions across all subjects (single query), newest first
    const { data: rows, error } = await (supabase as any)
      .from('sessions')
      .select('id, subject_id, title_enc, session_type, started_at, ended_at, created_at, updated_at')
      .eq('user_id', user.id)
      .not('subject_id', 'is', null)
      .order('started_at', { ascending: false, nullsFirst: false })
      .limit(fetchLimit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    type Agg = {
      subject_id: string
      last_call_at: string | null
      calls_count: number
      sessions: any[]
    }

    const bySubject = new Map<string, Agg>()
    for (const s of rows || []) {
      const sid = s.subject_id as string
      if (!sid) continue
      let agg = bySubject.get(sid)
      if (!agg) {
        agg = { subject_id: sid, last_call_at: s.started_at || s.created_at, calls_count: 0, sessions: [] }
        bySubject.set(sid, agg)
      }
      agg.calls_count += 1
      if (agg.sessions.length < sessionsPerSubject) {
        const startedAt = s.started_at || s.created_at
        const fallbackTitle = startedAt ? `Session @ ${new Date(startedAt).toLocaleTimeString('en-GB', { hour12: false })}` : 'Session'
        const looksEncoded = typeof s.title_enc === 'string' && /^[A-Za-z0-9+/=]{20,}$/.test(s.title_enc)
        agg.sessions.push({
          id: s.id,
          title: (s.title_enc && !looksEncoded) ? s.title_enc : fallbackTitle,
          type: s.session_type,
          started_at: s.started_at,
          created_at: s.created_at,
        })
      }
    }

    let aggs = Array.from(bySubject.values())
    aggs.sort((a, b) => new Date(b.last_call_at || 0).getTime() - new Date(a.last_call_at || 0).getTime())
    aggs = aggs.slice(0, subjectsLimit)

    const subjectIds = aggs.map(a => a.subject_id)

    // Fetch subject details in bulk (prefer customers over leads)
    const [{ data: custRows }, { data: leadRows }] = await Promise.all([
      (supabase as any)
        .from('customers')
        .select('subject_id, full_name, company, status')
        .in('subject_id', subjectIds)
        .eq('owner_id', user.id),
      (supabase as any)
        .from('leads')
        .select('subject_id, full_name, company, status')
        .in('subject_id', subjectIds)
        .eq('owner_id', user.id),
    ])

    const custById = new Map<string, any>()
    for (const r of custRows || []) custById.set(r.subject_id, r)
    const leadById = new Map<string, any>()
    for (const r of leadRows || []) leadById.set(r.subject_id, r)

    const subjects = aggs.map(a => {
      const cust = custById.get(a.subject_id)
      const lead = leadById.get(a.subject_id)
      const detail = cust || lead || {}
      const type = cust ? 'customer' : (lead ? 'lead' : null)
      const status = detail?.status || null
      const name = detail?.full_name || null
      const company = detail?.company || null
      const stage_label = type ? `${type.charAt(0).toUpperCase() + type.slice(1)}${status ? ' - ' + status : ''}` : null
      return {
        subject_id: a.subject_id,
        type,
        status,
        name,
        company,
        stage_label,
        last_call_at: a.last_call_at,
        calls_count: a.calls_count,
        sessions: a.sessions,
      }
    })

    return NextResponse.json(
      { subjects, total: subjects.length },
      {
        headers: {
          // Per-user cache only. Short TTL to keep UI snappy under repeated navigation.
          'Cache-Control': 'private, max-age=20, stale-while-revalidate=60'
        }
      }
    )
  } catch (error) {
    console.error('[subjects:overview] GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
