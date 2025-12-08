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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await getClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Verify invoice ownership
    const { data: invoice, error: invErr } = await (supabase as any)
      .from('invoices')
      .select('id, status')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    if (invErr || !invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Fetch pending/overdue schedules for this invoice
    const { data: schedules, error: schErr } = await (supabase as any)
      .from('invoice_payment_schedules')
      .select('id, status')
      .eq('invoice_id', id)
      .neq('status', 'paid')
    if (schErr) return NextResponse.json({ error: 'Failed to load schedules' }, { status: 500 })

    let paidCount = 0
    let invoicePaid = false
    const when = new Date().toISOString()
    for (const s of (schedules || [])) {
      const { data: rpcRes, error: rpcErr } = await (supabase as any)
        .rpc('mark_schedule_paid_cascade', { p_schedule_id: (s as any).id, p_paid_at: when })
      if (!rpcErr) {
        paidCount++
        if (rpcRes?.invoice_paid) {
          invoicePaid = true
        }
      }
    }

    // If no schedules remain and none exist at all, allow paying onetime invoice directly
    if ((schedules || []).length === 0) {
      const { count: anySched } = await (supabase as any)
        .from('invoice_payment_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_id', id)
      if ((anySched || 0) === 0) {
        await (supabase as any)
          .from('invoices')
          .update({ status: 'paid', paid_at: when })
          .eq('id', id)
          .eq('owner_id', user.id)
        invoicePaid = true
      }
    }

    // Ensure paying customer exists and link invoice when invoice is paid (DB function is canonical)
    if (invoicePaid) {
      try {
        await (supabase as any).rpc('ensure_paying_customer_for_invoice', { p_invoice_id: id })
      } catch {}
    }

    const finalStatus = invoicePaid ? 'paid' : (invoice as any).status

    return NextResponse.json({
      success: true,
      paid_schedules: paidCount,
      invoice_status: finalStatus,
      paid_at: invoicePaid ? when : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
