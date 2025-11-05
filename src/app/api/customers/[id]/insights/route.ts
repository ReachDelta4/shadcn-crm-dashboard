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

    // Customer
    const { data: customer, error: custErr } = await (supabase as any)
      .from('customers')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    if (custErr || !customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const customerEmail = (customer as any).email

    // Invoices for this customer (by customer_id, fallback by email)
    const { data: invById } = await (supabase as any)
      .from('invoices')
      .select('id, status, amount, date, paid_at')
      .eq('owner_id', user.id)
      .eq('customer_id', id)
    const byIdSet = new Set((invById || []).map((i: any) => i.id))
    const { data: invByEmail } = await (supabase as any)
      .from('invoices')
      .select('id, status, amount, date, paid_at')
      .eq('owner_id', user.id)
      .eq('email', customerEmail)
    const invAll = [...(invById || []), ...((invByEmail || []).filter((i: any) => !byIdSet.has(i.id)))]
    const invoiceIds = invAll.map((i: any) => i.id)

    // Invoice lines (fetch products separately to avoid FK/alias dependency)
    let lines: any[] = []
    if (invoiceIds.length > 0) {
      const { data: lineRows } = await (supabase as any)
        .from('invoice_lines')
        .select('id, invoice_id, product_id, description, quantity, total_minor, cogs_minor, payment_plan_id')
        .in('invoice_id', invoiceIds)
      lines = lineRows || []
      const productIds = Array.from(new Set(lines.map((l: any) => l.product_id).filter(Boolean)))
      if (productIds.length > 0) {
        const { data: prods } = await (supabase as any)
          .from('products')
          .select('id, name, recurring_interval')
          .in('id', productIds)
        const pmap = new Map((prods || []).map((p: any) => [p.id, p]))
        lines = lines.map((l: any) => ({ ...l, products: (l.product_id ? pmap.get(l.product_id) : null) || null }))
      }
    }

    // Payment schedules for invoices
    const { data: schedules } = invoiceIds.length > 0 ? await (supabase as any)
      .from('invoice_payment_schedules')
      .select('id, invoice_id, invoice_line_id, installment_num, due_at_utc, amount_minor, status, paid_at')
      .in('invoice_id', invoiceIds) : { data: [] }

    // Recurring schedules for lines
    const lineIds = lines.map(l => l.id)
    const { data: recurring } = lineIds.length > 0 ? await (supabase as any)
      .from('recurring_revenue_schedules')
      .select('id, invoice_line_id, cycle_num, billing_at_utc, amount_minor, status, billed_at')
      .in('invoice_line_id', lineIds) : { data: [] }

    // Sessions by subject_id if present
    let sessions: any[] = []
    if ((customer as any).subject_id) {
      const { data: sess } = await (supabase as any)
        .from('sessions')
        .select('id, mode, started_at, ended_at, created_at')
        .eq('subject_id', (customer as any).subject_id)
        .eq('user_id', user.id)
      sessions = sess || []
    }

    // Revenue/profit computation (realized only)
    const paidSchedules = (schedules || []).filter((s: any) => s.status === 'paid')
    const billedRecurring = (recurring || []).filter((r: any) => r.status === 'billed')

    const realizedFromSchedules = paidSchedules.reduce((sum: number, r: any) => sum + (r.amount_minor || 0), 0)
    const realizedFromRecurring = billedRecurring.reduce((sum: number, r: any) => sum + (r.amount_minor || 0), 0)

    // Onetime paid invoices (no schedules and no recurring lines for that invoice)
    const invHasSched = new Set((schedules || []).map((s: any) => s.invoice_id))
    const invHasRecur = new Set(lines.filter(l => (l.products?.recurring_interval ?? null) !== null).map(l => l.invoice_id))
    const onetimePaid = (invAll || []).filter((i: any) => i.status === 'paid' && !invHasSched.has(i.id) && !invHasRecur.has(i.id))
    const realizedFromOnetime = onetimePaid.reduce((sum: number, i: any) => sum + Math.round((i.amount || 0) * 100), 0)

    const realized_total_minor = realizedFromSchedules + realizedFromRecurring + realizedFromOnetime

    // COGS: proration for schedules/recurring, full for onetime
    const lineMap = new Map<string, { total_minor: number; cogs_minor: number }>()
    for (const l of lines) lineMap.set(l.id, { total_minor: l.total_minor || 0, cogs_minor: l.cogs_minor || 0 })

    function proration(lineId: string | null | undefined, amountMinor: number) {
      if (!lineId) return 0
      const m = lineMap.get(lineId)
      if (!m || !m.total_minor) return 0
      const ratio = Math.max(0, Math.min(1, amountMinor / m.total_minor))
      return Math.round((m.cogs_minor || 0) * ratio)
    }

    const cogsFromSchedules = paidSchedules.reduce((sum: number, s: any) => sum + proration(s.invoice_line_id, s.amount_minor || 0), 0)
    const cogsFromRecurring = billedRecurring.reduce((sum: number, r: any) => sum + proration(r.invoice_line_id, r.amount_minor || 0), 0)
    // Onetime cogs: sum all lines of onetime paid invoices
    const onetimeInvoiceIds = new Set(onetimePaid.map((i: any) => i.id))
    const cogsFromOnetime = lines.filter(l => onetimeInvoiceIds.has(l.invoice_id)).reduce((sum: number, l: any) => sum + (l.cogs_minor || 0), 0)
    const realized_cogs_minor = cogsFromSchedules + cogsFromRecurring + cogsFromOnetime

    const gross_profit_minor = Math.max(0, realized_total_minor - realized_cogs_minor)
    const gross_margin_percent = realized_total_minor > 0 ? (gross_profit_minor * 100) / realized_total_minor : 0

    // Aggregations
    const productStats: Record<string, { name: string; quantity: number; revenue_minor: number }> = {}
    for (const l of lines) {
      const key = l.product_id || l.description || 'unknown'
      if (!productStats[key]) productStats[key] = { name: l.products?.name || l.description || 'Product', quantity: 0, revenue_minor: 0 }
      productStats[key].quantity += l.quantity || 0
      productStats[key].revenue_minor += l.total_minor || 0
    }

    // Simple lifecycle timeline (best-effort)
    const firstInvoice = invAll.reduce((min: any, v: any) => (!min || (new Date(v.date) < new Date(min.date))) ? v : min, null)
    const firstPaid = (invAll.filter((i: any) => i.status === 'paid').reduce((min: any, v: any) => (!min || (new Date(v.paid_at || v.date) < new Date(min.paid_at || min.date))) ? v : min, null))
    const lastPaid = (invAll.filter((i: any) => i.status === 'paid').reduce((max: any, v: any) => (!max || (new Date(v.paid_at || v.date) > new Date(max.paid_at || max.date))) ? v : max, null))

    const lifecycle = [
      { label: 'Created', at: (customer as any).created_at, meta: {} },
      { label: 'Joined', at: (customer as any).date_joined, meta: {} },
      ...(firstInvoice ? [{ label: 'First Invoice', at: firstInvoice.date, meta: { invoice_id: firstInvoice.id } }] : []),
      ...(firstPaid ? [{ label: 'First Payment', at: firstPaid.paid_at || firstPaid.date, meta: { invoice_id: firstPaid.id } }] : []),
      ...(lastPaid ? [{ label: 'Last Payment', at: lastPaid.paid_at || lastPaid.date, meta: { invoice_id: lastPaid.id } }] : []),
      { label: 'Current Status', at: new Date().toISOString(), meta: { status: (customer as any).status } },
    ]

    return NextResponse.json({
      customer,
      invoices: invAll,
      lines,
      schedules: schedules || [],
      recurring: recurring || [],
      sessions,
      aggregates: {
        realized_total_minor,
        realized_cogs_minor,
        gross_profit_minor,
        gross_margin_percent,
        products: Object.values(productStats),
      },
      lifecycle,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
