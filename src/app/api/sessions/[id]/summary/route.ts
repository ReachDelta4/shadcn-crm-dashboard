import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { generateSummaryReport } from '@/server/services/summary-report'

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
    const repo = new ReportsV3TabsRepository(supabase as any)
    const row = await repo.findBySessionId(id, user.id)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const rep: any = (row as any).report || {}
    // Prefer combined markdown if present, else edge raw_markdown
    const base: string | null = (typeof rep.markdown === 'string' && rep.markdown.trim().length > 0)
      ? rep.markdown
      : (typeof rep.raw_markdown === 'string' && rep.raw_markdown.trim().length > 0)
        ? rep.raw_markdown
        : null
    // Extract only EXECUTIVE SUMMARY tab if markers present
    let markdown: string | null = null
    if (base) {
      const start = base.indexOf('<!-- TAB: EXECUTIVE SUMMARY -->')
      const end = base.indexOf('<!-- /TAB: EXECUTIVE SUMMARY -->')
      markdown = (start >= 0 && end > start) ? base.slice(start, end + '<!-- /TAB: EXECUTIVE SUMMARY -->'.length) : base
      // Strip markers from display (tolerate minor typos)
      markdown = markdown
        .replace(/<!--[^]*?-->/g, '')
        .replace(/<!-+\s*\/?\s*(TAB|SECTION):[^]*?-->/gi, '')
        .trim()
    }
    if (!markdown) {
      // If content is missing even when a row exists, treat as stale/missing and trigger regeneration.
      Promise.resolve().then(async () => {
        try { await fetch(`${new URL(request.url).origin}/api/sessions/${id}/summary`, { method: 'POST' }) } catch {}
      }).catch(() => {})
      const last_error = row?.last_error || 'TAB_MISSING_EXECUTIVE_SUMMARY'
      return NextResponse.json({ session_id: row.session_id, markdown: null, status: 'failed', attempts: row.attempts, last_error })
    }
    return NextResponse.json({ session_id: row.session_id, markdown, status: row.status, attempts: row.attempts, last_error: row.last_error })
  } catch (error) {
    console.error('[summary] GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    // In-app generation preferred
    Promise.resolve().then(async () => {
      try {
        await generateSummaryReport(supabase as any, user.id, id)
      } catch (e) {
        console.error('[summary] async generation error', e)
        // Optional fallback: edge function trigger
        if (process.env.SUMMARY_USE_EDGE === 'true') {
          try {
            const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const projectRef = new URL(projectUrl).hostname.split('.')[0]
            const fnUrl = `https://${projectRef}.supabase.co/functions/v1/generate-reports`
            const auth = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            await fetch(fnUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth}` }, body: JSON.stringify({ session_id: id }) })
          } catch {}
        }
      }
    }).catch(() => {})

    return NextResponse.json({ accepted: true }, { status: 202 })
  } catch (error) {
    console.error('[summary] POST error', error)
    return NextResponse.json({ error: 'Failed to trigger summary generation' }, { status: 500 })
  }
}
export const runtime = 'nodejs'
