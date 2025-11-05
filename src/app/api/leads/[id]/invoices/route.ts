import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({name, value, options}) => cookieStore.set(name, value, options)) } }
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch lead to get email for fallback
    const { data: lead } = await (supabase as any)
      .from('leads')
      .select('email')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()

    const byLead = await (supabase as any)
      .from('invoices')
      .select('id, invoice_number, status, amount, date, paid_at, items')
      .eq('owner_id', user.id)
      .eq('lead_id', id)

    const invs = (byLead.data || []) as any[]
    if (lead?.email) {
      const byEmail = await (supabase as any)
        .from('invoices')
        .select('id, invoice_number, status, amount, date, paid_at, items')
        .eq('owner_id', user.id)
        .eq('email', lead.email)
      const seen = new Set(invs.map(i => i.id))
      for (const r of (byEmail.data || [])) if (!seen.has(r.id)) invs.push(r)
    }

    return NextResponse.json({ invoices: invs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

