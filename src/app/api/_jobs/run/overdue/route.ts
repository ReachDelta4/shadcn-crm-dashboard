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

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace(/Bearer\s+/i, '')
    if (!token || token !== process.env.JOB_RUNNER_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const supabase = await getClient()

    const nowIso = new Date().toISOString()

    // Mark payment schedules overdue where past due and not paid
    const { data: dueSchedules, error: dueErr } = await (supabase as any)
      .from('invoice_payment_schedules')
      .select('id, invoice_id, status, due_at_utc')
      .lt('due_at_utc', nowIso)
      .neq('status', 'paid')
    if (dueErr) throw dueErr

    let updated = 0
    const affectedInvoices = new Set<string>()
    for (const s of (dueSchedules || [])) {
      if ((s as any).status !== 'overdue') {
        const { error: upErr } = await (supabase as any)
          .from('invoice_payment_schedules')
          .update({ status: 'overdue' })
          .eq('id', (s as any).id)
        if (!upErr) { updated++; affectedInvoices.add((s as any).invoice_id) }
      }
    }

    // Mark invoices overdue if any schedule overdue and invoice not paid/cancelled
    const invIds = Array.from(affectedInvoices)
    let invoicesUpdated = 0
    if (invIds.length > 0) {
      // Fetch invoices
      const { data: invs } = await (supabase as any)
        .from('invoices')
        .select('id, status')
        .in('id', invIds)
      for (const inv of (invs || [])) {
        if ((inv as any).status === 'paid' || (inv as any).status === 'cancelled') continue
        const { count: hasOverdue } = await (supabase as any)
          .from('invoice_payment_schedules')
          .select('*', { count: 'exact', head: true })
          .eq('invoice_id', (inv as any).id)
          .eq('status', 'overdue')
        if ((hasOverdue || 0) > 0) {
          const { error: invErr } = await (supabase as any)
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('id', (inv as any).id)
          if (!invErr) invoicesUpdated++
        }
      }
    }

    return NextResponse.json({ schedules_marked_overdue: updated, invoices_marked_overdue: invoicesUpdated })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}

