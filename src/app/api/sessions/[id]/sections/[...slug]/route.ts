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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slug: string[] }> }
) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, slug } = await params
    const url = new URL(request.url)
    const reportKind = (url.searchParams.get('report_kind') || 'tabs').toLowerCase() as 'tabs'|'v3'
    const slugPath = (slug || []).join('/')
    if (!slugPath) return NextResponse.json({ error: 'Missing slug' }, { status: 400 })

    const { data: row, error } = await (supabase as any)
      .from('report_sections')
      .select('slug_path,title,level,content_markdown,start_line,end_line')
      .eq('session_id', id)
      .eq('report_kind', reportKind)
      .eq('slug_path', slugPath)
      .single()
    if (error) {
      if ((error as any).code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ session_id: id, report_kind: reportKind, item: row })
  } catch (error) {
    console.error('[sections] by-slug GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

