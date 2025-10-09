import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const querySchema = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
	groupBy: z.enum(['month', 'week', 'day']).default('month'),
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

export async function GET(request: NextRequest) {
    try {
        const supabase = await getServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { searchParams } = new URL(request.url)

        // Be resilient to bad/missing params: default to last 30 days and 'month'
        const parsed = querySchema.safeParse({
            from: searchParams.get('from'),
            to: searchParams.get('to'),
            groupBy: searchParams.get('groupBy') || undefined,
        })

        const now = new Date()
        const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        let groupBy: 'month' | 'week' | 'day' = 'month'
        let from: string | undefined = defaultFrom.toISOString()
        let to: string | undefined = now.toISOString()
        if (parsed.success) {
            groupBy = parsed.data.groupBy
            if (parsed.data.from) from = parsed.data.from
            if (parsed.data.to) to = parsed.data.to
        }
        // Clamp if range inverted
        if (from && to && new Date(from) > new Date(to)) {
            const tmp = from; from = to; to = tmp
        }

		// Build date filter for schedules
		let dateFilter = ''
		const params: any[] = []
		if (from) {
			dateFilter = 'AND due_at_utc >= $1'
			params.push(from)
		}
		if (to) {
			dateFilter += ` AND due_at_utc <= $${params.length + 1}`
			params.push(to)
		}

        // Basic engine: realized revenue from paid invoices (one-time)
        // Pending snapshot: sent/pending/overdue; Draft snapshot: draft; Lead potential from open leads.
        // Use invoice.date for grouping (no paid_at yet).

        const payRealizedQuery = supabase
            .from('invoice_payment_schedules')
            .select('amount_minor, paid_at, invoice_id, invoices!inner(owner_id)')
            .eq('invoices.owner_id', user.id)
            .not('paid_at', 'is', null)
        if (from) (payRealizedQuery as any).gte('paid_at', from)
        if (to) (payRealizedQuery as any).lte('paid_at', to)

        // Two-step owner-scoped recurring fetch: invoices -> invoice_lines -> recurring schedules
        const invIdsRes = await supabase
            .from('invoices')
            .select('id')
            .eq('owner_id', user.id)
        let recRealizedRes: any = { data: [], error: null }
        if (!invIdsRes.error && (invIdsRes.data || []).length > 0) {
            const invIds = (invIdsRes.data || []).map((r: any) => r.id).filter(Boolean)
            const lineIdsRes = await (supabase as any)
                .from('invoice_lines')
                .select('id')
                .in('invoice_id', invIds)
            if (!lineIdsRes.error && (lineIdsRes.data || []).length > 0) {
                const lineIds = (lineIdsRes.data || []).map((r: any) => r.id).filter(Boolean)
                let recQuery: any = (supabase as any)
                    .from('recurring_revenue_schedules')
                    .select('amount_minor, billing_at_utc, status, invoice_line_id')
                    .in('invoice_line_id', lineIds)
                    .eq('status', 'billed')
                if (from) recQuery = recQuery.gte('billing_at_utc', from)
                if (to) recQuery = recQuery.lte('billing_at_utc', to)
                recRealizedRes = await recQuery
            }
        }

        const pendingQuery = supabase
            .from('invoices')
            .select('amount, status, date')
            .eq('owner_id', user.id)
            .in('status', ['sent','pending','overdue'])
        if (from) (pendingQuery as any).gte('date', from)
        if (to) (pendingQuery as any).lte('date', to)

        const draftQuery = supabase
            .from('invoices')
            .select('amount, date')
            .eq('owner_id', user.id)
            .eq('status', 'draft')
        if (from) (draftQuery as any).gte('date', from)
        if (to) (draftQuery as any).lte('date', to)

        const leadsQuery = supabase
            .from('leads')
            .select('value, status, date')
            .eq('owner_id', user.id)
            .not('status', 'in', '(lost,disqualified,converted)')
        if (from) (leadsQuery as any).gte('date', from)
        if (to) (leadsQuery as any).lte('date', to)

        const [payRealizedRes, pendingRes, draftRes, leadsRes] = await Promise.all([
            payRealizedQuery, pendingQuery, draftQuery, leadsQuery
        ])

        if (payRealizedRes.error || recRealizedRes.error || pendingRes.error || draftRes.error || leadsRes.error) {
            console.error('Revenue aggregation errors:', { pay: payRealizedRes.error, rec: recRealizedRes.error, pending: pendingRes.error, draft: draftRes.error, leads: leadsRes.error })
            return NextResponse.json({ error: 'Failed to aggregate revenue' }, { status: 500 })
        }

        // Group realized by period (paid schedules + billed recurring)
        const payRows = (payRealizedRes.data || []) as any[]
        const recRows = (recRealizedRes.data || []) as any[]
        const revenueMap = new Map<string, number>()
        const groupDate = (iso: string) => {
            const d = new Date(iso)
            if (groupBy === 'day') return d.toISOString().slice(0, 10)
            if (groupBy === 'week') {
                const first = new Date(d)
                const day = first.getUTCDay() || 7
                first.setUTCDate(first.getUTCDate() - day + 1)
                return first.toISOString().slice(0, 10)
            }
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
        }

        payRows.forEach(r => {
            if (!r.paid_at) return
            const key = groupDate(r.paid_at)
            const minor = Number(r.amount_minor) || 0
            revenueMap.set(key, (revenueMap.get(key) || 0) + minor)
        })
        recRows.forEach(r => {
            if (!r.billing_at_utc) return
            const key = groupDate(r.billing_at_utc)
            const minor = Number(r.amount_minor) || 0
            revenueMap.set(key, (revenueMap.get(key) || 0) + minor)
        })

        const revenue = Array.from(revenueMap.entries()).map(([period, total]) => ({ period, total_revenue_minor: total, sources: {} }))
            .sort((a, b) => a.period.localeCompare(b.period))

        // Compute COGS for gross profit/margin
        const paidInvoiceIds = payRows.map(r => (r as any).invoice_id).filter(Boolean)
        let total_cogs_minor = 0
        if (paidInvoiceIds.length > 0) {
            const linesRes = await supabase
                .from('invoice_lines')
                .select('quantity, unit_price_minor, discount_type, discount_value, cogs_type, cogs_value')
                .in('invoice_id', paidInvoiceIds)
            if (linesRes.error) {
                console.error('Failed to fetch invoice_lines for COGS:', linesRes.error)
            } else {
                (linesRes.data || []).forEach((line: any) => {
                    const quantity = Number(line.quantity) || 0
                    const unitMinor = Number(line.unit_price_minor) || 0
                    let subtotalMinor = quantity * unitMinor
                    // Apply discount
                    if (line.discount_type === 'percent' && line.discount_value) {
                        const discountBp = Number(line.discount_value) || 0
                        subtotalMinor = Math.round(subtotalMinor * (1 - discountBp / 10000))
                    } else if (line.discount_type === 'amount' && line.discount_value) {
                        const discountMinor = Number(line.discount_value) || 0
                        subtotalMinor = Math.max(0, subtotalMinor - discountMinor)
                    }
                    // Compute COGS
                    if (line.cogs_type === 'percent' && line.cogs_value) {
                        const cogsBp = Number(line.cogs_value) || 0
                        total_cogs_minor += Math.round(subtotalMinor * cogsBp / 10000)
                    } else if (line.cogs_type === 'amount' && line.cogs_value) {
                        const cogsPerUnit = Number(line.cogs_value) || 0
                        total_cogs_minor += quantity * cogsPerUnit
                    }
                })
            }
        }

        // Snapshots
        const toMinor = (n: any) => Math.round((Number(n) || 0) * 100)
        const pending_total_minor = (pendingRes.data || []).reduce((s: number, r: any) => s + toMinor(r.amount), 0)
        const draft_total_minor = (draftRes.data || []).reduce((s: number, r: any) => s + toMinor(r.amount), 0)
        const lead_potential_minor = (leadsRes.data || []).reduce((s: number, r: any) => s + toMinor(r.value), 0)
        const realized_total_minor = revenue.reduce((s, r) => s + r.total_revenue_minor, 0)
        const gross_profit_minor = realized_total_minor - total_cogs_minor
        const gross_margin_percent = realized_total_minor > 0 ? (gross_profit_minor / realized_total_minor) * 100 : 0

        return NextResponse.json({ 
            revenue, 
            realized_total_minor, 
            pending_total_minor, 
            draft_total_minor, 
            lead_potential_minor,
            gross_profit_minor,
            gross_margin_percent
        }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } })
	} catch (e: any) {
		console.error('Revenue report error:', e)
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}
