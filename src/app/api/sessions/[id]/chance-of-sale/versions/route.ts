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
    if (!subjectId) return NextResponse.json({ versions: [] })

    const { data: versions, error } = await (supabase as any)
      .from('cos_versions')
      .select('version, created_at, source, reason, session_id')
      .eq('subject_id', subjectId)
      .order('version', { ascending: false })
    if (error) throw error
    return NextResponse.json({ versions: versions || [] })
  } catch (error) {
    console.error('[chance-of-sale:versions] GET error', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}
export const runtime = 'nodejs'
