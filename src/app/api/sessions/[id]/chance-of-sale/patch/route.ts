import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateCosPatchFromModel, applyCosPatch, CosPatchOp } from '@/server/services/chance-of-sale-patch'

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json().catch(() => ({}))

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

    // If explicit ops provided, apply directly; else, let the model propose patch ops via tool call
    if (Array.isArray(body?.operations) && body.operations.length > 0) {
      const ops = body.operations as CosPatchOp[]
      const result = await applyCosPatch(supabase as any, user.id, id, ops)
      return NextResponse.json({ applied: true, operations: ops, markdown: result.markdown })
    }

    const result = await generateCosPatchFromModel(supabase as any, user.id, id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[chance-of-sale:patch] POST error', error)
    return NextResponse.json({ error: 'Failed to apply targeted edits' }, { status: 500 })
  }
}
export const runtime = 'nodejs'
