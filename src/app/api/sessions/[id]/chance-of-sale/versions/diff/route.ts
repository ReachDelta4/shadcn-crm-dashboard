import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const sessionsRepo = new SessionsRepository(supabase)
    const session = await sessionsRepo.findById(id, user.id)
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    const subjectId = (session as any)?.subject_id
    if (!subjectId) return NextResponse.json({ error: 'No subject for session' }, { status: 400 })

    const url = new URL(request.url)
    const fromV = Number(url.searchParams.get('from') || '0')
    const toV = Number(url.searchParams.get('to') || '0')
    if (!fromV || !toV) return NextResponse.json({ error: 'from and to version are required' }, { status: 400 })

    const { data: fromRows, error: e1 } = await (supabase as any)
      .from('cos_versions')
      .select('version, markdown, ops_json, created_at, source, reason')
      .eq('subject_id', subjectId)
      .eq('version', fromV)
      .limit(1)
    if (e1) throw e1
    const { data: toRows, error: e2 } = await (supabase as any)
      .from('cos_versions')
      .select('version, markdown, ops_json, created_at, source, reason')
      .eq('subject_id', subjectId)
      .eq('version', toV)
      .limit(1)
    if (e2) throw e2

    const from = fromRows?.[0] || null
    const to = toRows?.[0] || null
    if (!from || !to) return NextResponse.json({ error: 'Version(s) not found' }, { status: 404 })
    return NextResponse.json({ from, to })
  } catch (error) {
    console.error('[chance-of-sale:versions:diff] GET error', error)
    return NextResponse.json({ error: 'Failed to fetch diff' }, { status: 500 })
  }
}
export const runtime = 'nodejs'
