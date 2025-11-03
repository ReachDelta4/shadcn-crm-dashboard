import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { generateChanceOfSaleReport } from '@/server/services/chance-of-sale-report'
import { decideChanceOfSaleUpdate } from '@/server/services/chance-of-sale-decision'

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
    const markdown: string | null = (row.report as any)?.markdown || null
    // Extract only Chance of Sale portion (marker based)
    let chance: string | null = null
    if (markdown) {
      const start = markdown.indexOf('<!-- TAB: CHANCE OF SALE -->')
      const end = markdown.indexOf('<!-- /TAB: CHANCE OF SALE -->')
      if (start >= 0 && end > start) chance = markdown.slice(start, end + '<!-- /TAB: CHANCE OF SALE -->'.length)
    }
    if (!chance && (row.status === 'queued' || row.status === 'running')) {
      Promise.resolve().then(async () => {
        try {
          await fetch(`${new URL(request.url).origin}/api/sessions/${id}/chance-of-sale`, { method: 'POST' })
        } catch {}
      }).catch(() => {})
    }
    return NextResponse.json({ session_id: row.session_id, markdown: chance, status: row.status, attempts: row.attempts, last_error: row.last_error })
  } catch (error) {
    console.error('[chance-of-sale] GET error', error)
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

    // Rate limiting per user: max 3 CoS updates per 10 minutes
    try {
      const cutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const { data: recent, error: rlErr } = await (supabase as any)
        .from('cos_versions')
        .select('id')
        .eq('created_by', user.id)
        .gte('created_at', cutoff)
      if (!rlErr && (recent?.length || 0) >= 3) {
        return NextResponse.json({ error: 'Rate limit exceeded: Try again later.' }, { status: 429 })
      }
    } catch {}

    const decision = await decideChanceOfSaleUpdate(supabase as any, user.id, id)
    if (decision.action === 'skip') {
      return NextResponse.json({ accepted: false, decision }, { status: 200 })
    }

    // In-app generation preferred: If an existing CoS exists, run targeted patch; else full generation
    Promise.resolve().then(async () => {
      try {
        const repo = new (await import('@/server/repositories/reports-v3-tabs')).ReportsV3TabsRepository(supabase as any)
        const row = await repo.findBySessionId(id, user.id)
        const hasCos = typeof ((row?.report as any)?.markdown || '').includes('<!-- TAB: CHANCE OF SALE -->') === 'boolean'
          ? ((row?.report as any)?.markdown || '').includes('<!-- TAB: CHANCE OF SALE -->')
          : false
        if (hasCos) {
          const { generateCosPatchFromModel } = await import('@/server/services/chance-of-sale-patch')
          await generateCosPatchFromModel(supabase as any, user.id, id)
        } else {
          await generateChanceOfSaleReport(supabase as any, user.id, id)
        }
      } catch (e) {
        console.error('[chance-of-sale] async generation error', e)
        if (process.env.COS_USE_EDGE === 'true') {
          try {
            const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const projectRef = new URL(projectUrl).hostname.split('.')[0]
            const fnUrl = `https://${projectRef}.supabase.co/functions/v1/generate-reports`
            const auth = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            await fetch(fnUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth}` }, body: JSON.stringify({ session_id: id, decision }) })
          } catch {}
        }
      }
    }).catch(() => {})

    return NextResponse.json({ accepted: true, decision }, { status: 202 })
  } catch (error) {
    console.error('[chance-of-sale] POST error', error)
    return NextResponse.json({ error: 'Failed to trigger chance-of-sale generation' }, { status: 500 })
  }
}
export const runtime = 'nodejs'
