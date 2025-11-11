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

function parseQuery(req: NextRequest): { reportKind: 'tabs'|'v3'; prefix?: string; depth?: number; limit: number; offset: number } {
  const url = new URL(req.url)
  const reportKind = (url.searchParams.get('report_kind') || 'tabs').toLowerCase() as 'tabs'|'v3'
  const prefix = url.searchParams.get('prefix') || undefined
  const depth = (() => {
    const d = url.searchParams.get('depth')
    const n = d ? parseInt(d, 10) : undefined
    return (n && n > 0 && n < 16) ? n : undefined
  })()
  const limit = (() => {
    const l = parseInt(url.searchParams.get('limit') || '200', 10)
    return Math.min(Math.max(1, isNaN(l) ? 200 : l), 500)
  })()
  const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10) || 0)
  return { reportKind, prefix, depth, limit, offset }
}

function withinDepth(slug: string, prefix: string, depth: number): boolean {
  if (!prefix) return true
  if (!slug.startsWith(prefix)) return false
  const pSegs = prefix.split('/').filter(Boolean).length
  const sSegs = slug.split('/').filter(Boolean).length
  return (sSegs - pSegs) <= depth
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

    const { reportKind, prefix, depth, limit, offset } = parseQuery(request)

    let q = (supabase as any)
      .from('report_sections')
      .select('slug_path,title,level,content_markdown,start_line,end_line')
      .eq('session_id', id)
      .eq('report_kind', reportKind)
      .order('start_line', { ascending: true })

    if (prefix) {
      q = q.like('slug_path', `${prefix}%`)
    }

    const { data: rows, error } = await q.range(offset, offset + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const items = (() => {
      if (!prefix || !depth) return rows || []
      return (rows || []).filter(r => withinDepth(r.slug_path as string, prefix, depth))
    })()

    return NextResponse.json({ session_id: id, report_kind: reportKind, count: items.length, items })
  } catch (error) {
    console.error('[sections] GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

