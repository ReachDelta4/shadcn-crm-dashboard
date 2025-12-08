import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

export const runtime = 'nodejs'

const querySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  groupBy: z.enum(['day','week','month']).optional().default('month'),
})

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

function mergeSeries(series: Array<{ period: string; amount_minor: number }>) {
  const map = new Map<string, number>()
  for (const row of series || []) {
    const prev = map.get(row.period) || 0
    map.set(row.period, prev + (row.amount_minor || 0))
  }
  return Array.from(map.entries()).map(([period, amount_minor]) => ({ period, amount_minor }))
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user!.id as string

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      groupBy: (searchParams.get('groupBy') as any) || undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid params', details: parsed.error.flatten() }, { status: 400 })
    }

    const from = parsed.data.from || null
    const to = parsed.data.to || null
    const groupBy = parsed.data.groupBy

    // Helper to call RPC with safe fallback (rpc() is awaitable but may not expose .catch())
    async function rpcSeries(name: string) {
      try {
        const res = await (supabase as any).rpc(name, { user_id: userId, date_from: from, date_to: to, group_by: groupBy })
        return (res?.data || []) as Array<{ period: string; amount_minor: number }>
      } catch {
        return [] as Array<{ period: string; amount_minor: number }>
      }
    }

    // Source series via RPC (if available) for visualization
    const [oneSeries, schedSeries, recurSeries] = await Promise.all([
      rpcSeries('get_onetime_invoice_revenue'),
      rpcSeries('get_payment_schedule_revenue'),
      rpcSeries('get_recurring_revenue'),
    ])

    // Build merged periods and totals in UI-expected shape
    const allPeriods = new Set<string>([
      ...oneSeries.map(r => r.period),
      ...schedSeries.map(r => r.period),
      ...recurSeries.map(r => r.period),
    ])

    const revenue = Array.from(allPeriods.values()).sort().map(period => {
      const oneAmt = oneSeries.find(r => r.period === period)?.amount_minor || 0
      const schedAmt = schedSeries.find(r => r.period === period)?.amount_minor || 0
      const recurAmt = recurSeries.find(rw => rw.period === period)?.amount_minor || 0
      return {
        period,
        total_revenue_minor: oneAmt + schedAmt + recurAmt,
        sources: {
          one_time_invoices: oneAmt,
          payment_schedules: schedAmt,
          recurring_revenue: recurAmt,
        },
      }
    })

    // KPIs (owner-scoped); use schedule tables for realized/pending and invoices/leads for draft/potential
    // Payment schedules realized (paid)
    const paidSchedQuery = (supabase as any)
      .from('invoice_payment_schedules')
      .select('amount_minor, invoice_line_id, invoices!inner(owner_id)')
      .eq('invoices.owner_id', userId)
      .eq('status', 'paid')
    if (from) paidSchedQuery.gte('paid_at', from)
    if (to) paidSchedQuery.lte('paid_at', to)
    const paidSchedRes = await paidSchedQuery
    const paidSchedules = (paidSchedRes.data || []) as Array<{ amount_minor: number; invoice_line_id: string | null }>

    // Recurring realized (billed)
    const billedRecQuery = (supabase as any)
      .from('recurring_revenue_schedules')
      .select('amount_minor, invoice_line_id, invoices!invoice_lines_invoice_id_fkey!inner(owner_id), invoice_lines!inner(id)')
      .eq('invoices.owner_id', userId)
      .eq('status', 'billed')
    if (from) billedRecQuery.gte('billed_at', from)
    if (to) billedRecQuery.lte('billed_at', to)
    const billedRecRes = await billedRecQuery
    const billedRecurring = (billedRecRes.data || []) as Array<{ amount_minor: number; invoice_line_id: string }>

    // Pending = unpaid schedules + unbilled recurring within range
    const pendingSchedQuery = (supabase as any)
      .from('invoice_payment_schedules')
      .select('amount_minor, invoice_line_id, invoices!inner(owner_id), status')
      .eq('invoices.owner_id', userId)
    if (from) pendingSchedQuery.gte('due_at_utc', from)
    if (to) pendingSchedQuery.lte('due_at_utc', to)
    const pendingSchedRes = await pendingSchedQuery
    const pendingSchedules = ((pendingSchedRes.data || []) as Array<{
      amount_minor: number
      invoice_line_id: string | null
      status: string
    }>).filter(row => row.status === 'pending' || row.status === 'overdue')

    const scheduledRecQuery = (supabase as any)
      .from('recurring_revenue_schedules')
      .select('amount_minor, invoice_line_id, invoices!invoice_lines_invoice_id_fkey!inner(owner_id)')
      .eq('invoices.owner_id', user.id)
      .eq('status', 'scheduled')
    if (from) scheduledRecQuery.gte('billing_at_utc', from)
    if (to) scheduledRecQuery.lte('billing_at_utc', to)
    const scheduledRecRes = await scheduledRecQuery
    const scheduledRecurring = (scheduledRecRes.data || []) as Array<{
      amount_minor: number
      invoice_line_id: string
    }>

    // Draft invoices (sum amount in minor)
    const draftInvRes = await (supabase as any)
      .from('invoices')
      .select('amount')
      .eq('owner_id', userId)
      .eq('status', 'draft')
    const draftInvoices = (draftInvRes.data || []) as Array<{ amount: number }>

    // Lead potential (sum open leads value)
    const leadsRes = await (supabase as any)
      .from('leads')
      .select('value, status')
      .eq('owner_id', userId)
      .is('deleted_at', null)
    const leads = (leadsRes.data || []) as Array<{ value: number; status: string }>
    const openLeads = leads.filter(l => l.status !== 'converted' && l.status !== 'disqualified')

    // Onetime invoices (no schedules and no recurring lines) — include in KPIs
    async function sumOnetimeInvoices(statuses: string[]) {
      let q = (supabase as any)
        .from('invoices')
        .select('id, amount, status')
        .eq('owner_id', userId)
      if (statuses.length === 1) {
        q = q.eq('status', statuses[0])
      }
      if (from) q = q.gte('date', from)
      if (to) q = q.lte('date', to)
      // Filter: exclude if any schedules exist
      const { data: invs, error: invErr } = await q
      if (invErr) return { totalMinor: 0, invoiceIds: [] as string[] }
      const filtered = (invs || []).filter((i: any) => statuses.includes(i.status))
      const ids = filtered.map((i: any) => i.id)
      if (ids.length === 0) return { totalMinor: 0, invoiceIds: [] as string[] }
      // Exclude invoices that have schedules
      const { data: schedAny } = await (supabase as any)
        .from('invoice_payment_schedules')
        .select('invoice_id')
        .in('invoice_id', ids)
      const withSched = new Set((schedAny || []).map((r: any) => r.invoice_id))
      const candidate = filtered.filter((i: any) => !withSched.has(i.id))
      if (candidate.length === 0) return { totalMinor: 0, invoiceIds: [] as string[] }
      // Exclude invoices whose any line is recurring
      const { data: recurLines } = await (supabase as any)
        .from('invoice_lines')
        .select('invoice_id, product_id, products:product_id(recurring_interval)')
        .in('invoice_id', candidate.map((c: any) => c.id))
      const recurringInvoiceIds = new Set((recurLines || []).filter((rl: any) => (rl.products?.recurring_interval ?? null) !== null).map((rl: any) => rl.invoice_id))
      const final = candidate.filter((c: any) => !recurringInvoiceIds.has(c.id))
      const totalMinor = final.reduce((s: number, r: any) => s + Math.round((r.amount || 0) * 100), 0)
      return { totalMinor, invoiceIds: final.map((f: any) => f.id as string) }
    }

    const { totalMinor: onetimeRealizedMinor, invoiceIds: onetimeRealizedIds } = await sumOnetimeInvoices(['paid'])
    const { totalMinor: onetimePendingMinor, invoiceIds: onetimePendingIds } = await sumOnetimeInvoices(['pending','overdue','sent'])

    // Realized revenue total (schedules + recurring + onetime paid)
    const realizedFromSchedules = paidSchedules.reduce((s, r) => s + (r.amount_minor || 0), 0)
    const realizedFromRecurring = billedRecurring.reduce((s, r) => s + (r.amount_minor || 0), 0)
    const realized_total_minor = realizedFromSchedules + realizedFromRecurring + onetimeRealizedMinor

    // Pending revenue total (unpaid + unbilled in range + onetime sent/pending/overdue)
    const pendingFromSchedules = pendingSchedules.reduce((s, r) => s + (r.amount_minor || 0), 0)
    const pendingFromRecurring = scheduledRecurring.reduce((s, r) => s + (r.amount_minor || 0), 0)
    const pending_total_minor = pendingFromSchedules + pendingFromRecurring + onetimePendingMinor

    const draft_total_minor = draftInvoices.reduce((s, r) => s + Math.round((r.amount || 0) * 100), 0)
    const lead_potential_minor = openLeads.reduce((s, r) => s + Math.round((r.value || 0) * 100), 0)

    // Realized COGS & tax: pro-rate invoice_line values by realized amount per line
    const allLineIds = Array.from(
      new Set([
        ...paidSchedules.map(r => r.invoice_line_id).filter(Boolean) as string[],
        ...billedRecurring.map(r => r.invoice_line_id).filter(Boolean) as string[],
        ...pendingSchedules.map(r => r.invoice_line_id).filter(Boolean) as string[],
        ...scheduledRecurring.map(r => r.invoice_line_id).filter(Boolean) as string[],
      ]),
    )

    type LineAgg = { total_minor: number; cogs_minor: number; tax_minor: number }
    let lineMap = new Map<string, LineAgg>()
    if (allLineIds.length > 0) {
      const lineRes = await (supabase as any)
        .from('invoice_lines')
        .select('id, total_minor, cogs_minor, tax_minor')
        .in('id', allLineIds)
      const lines = (lineRes.data || []) as Array<{ id: string; total_minor: number; cogs_minor: number; tax_minor: number }>
      lineMap = new Map(
        lines.map(l => [
          l.id,
          {
            total_minor: l.total_minor || 0,
            cogs_minor: l.cogs_minor || 0,
            tax_minor: l.tax_minor || 0,
          },
        ]),
      )
    }

    function prorate(lineId: string | null | undefined, amountMinor: number, field: 'cogs_minor' | 'tax_minor'): number {
      if (!lineId) return 0
      const l = lineMap.get(lineId)
      if (!l || !l.total_minor || l.total_minor <= 0) return 0
      const ratio = Math.max(0, Math.min(1, amountMinor / l.total_minor))
      const base = field === 'cogs_minor' ? (l.cogs_minor || 0) : (l.tax_minor || 0)
      return Math.round(base * ratio)
    }

    // Add COGS and tax for onetime realized invoices (full line values)
    let onetimeCogsMinor = 0
    let onetimeTaxMinor = 0
    if (onetimeRealizedIds.length > 0) {
      const { data: otLines } = await (supabase as any)
        .from('invoice_lines')
        .select('id, invoice_id, cogs_minor, tax_minor')
        .in('invoice_id', onetimeRealizedIds)
      onetimeCogsMinor = (otLines || []).reduce((s: number, l: any) => s + (l.cogs_minor || 0), 0)
      onetimeTaxMinor = (otLines || []).reduce((s: number, l: any) => s + (l.tax_minor || 0), 0)
    }
    const realized_cogs_from_sched = paidSchedules.reduce(
      (s, r) => s + prorate(r.invoice_line_id, r.amount_minor || 0, 'cogs_minor'),
      0,
    )
    const realized_cogs_from_recur = billedRecurring.reduce(
      (s, r) => s + prorate(r.invoice_line_id, r.amount_minor || 0, 'cogs_minor'),
      0,
    )
    const realized_cogs_minor = realized_cogs_from_sched + realized_cogs_from_recur + onetimeCogsMinor

    const realized_tax_from_sched = paidSchedules.reduce(
      (s, r) => s + prorate(r.invoice_line_id, r.amount_minor || 0, 'tax_minor'),
      0,
    )
    const realized_tax_from_recur = billedRecurring.reduce(
      (s, r) => s + prorate(r.invoice_line_id, r.amount_minor || 0, 'tax_minor'),
      0,
    )
    const realized_tax_minor = realized_tax_from_sched + realized_tax_from_recur + onetimeTaxMinor

    const realized_net_revenue_minor = Math.max(0, realized_total_minor - realized_tax_minor)
    const gross_profit_minor =
      realized_net_revenue_minor > 0 ? Math.max(0, realized_net_revenue_minor - realized_cogs_minor) : 0
    const gross_margin_percent =
      realized_net_revenue_minor > 0 ? (gross_profit_minor * 100) / realized_net_revenue_minor : 0

    // Pending tax & net revenue (mirror realized breakdown, but for pending flows)
    const pending_tax_from_sched = pendingSchedules.reduce(
      (s, r) => s + prorate(r.invoice_line_id, r.amount_minor || 0, 'tax_minor'),
      0,
    )
    const pending_tax_from_recur = scheduledRecurring.reduce(
      (s, r) => s + prorate(r.invoice_line_id, r.amount_minor || 0, 'tax_minor'),
      0,
    )

    let onetimePendingTaxMinor = 0
    if (onetimePendingIds.length > 0) {
      const { data: pendingLines } = await (supabase as any)
        .from('invoice_lines')
        .select('invoice_id, tax_minor')
        .in('invoice_id', onetimePendingIds)
      onetimePendingTaxMinor = (pendingLines || []).reduce(
        (s: number, l: any) => s + (l.tax_minor || 0),
        0,
      )
    }

    const pending_tax_minor = pending_tax_from_sched + pending_tax_from_recur + onetimePendingTaxMinor
    const pending_net_revenue_minor = Math.max(0, pending_total_minor - pending_tax_minor)

    return NextResponse.json({
      groupBy,
      from,
      to,
      revenue,
      realized_total_minor,
      realized_net_revenue_minor,
      realized_tax_minor,
      pending_total_minor,
      pending_net_revenue_minor,
      pending_tax_minor,
      draft_total_minor,
      lead_potential_minor,
      gross_profit_minor,
      gross_margin_percent,
    })
  } catch (e: any) {
    console.error('[reports/revenue] GET error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
