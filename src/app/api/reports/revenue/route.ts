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
		const parsed = querySchema.safeParse({ from: searchParams.get('from'), to: searchParams.get('to'), groupBy: searchParams.get('groupBy') })
		if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

		const { from, to, groupBy } = parsed.data

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

		// Aggregate payment schedules revenue by date period
		const paymentRevenueQuery = supabase
			.rpc('get_payment_schedule_revenue', {
				user_id: user.id,
				date_from: from || null,
				date_to: to || null,
				group_by: groupBy
			})

		// Aggregate recurring revenue schedules by date period
		const recurringRevenueQuery = supabase
			.rpc('get_recurring_revenue', {
				user_id: user.id,
				date_from: from || null,
				date_to: to || null,
				group_by: groupBy
			})

		// For one-time invoices without schedules (immediate recognition)
		const oneTimeRevenueQuery = supabase
			.rpc('get_onetime_invoice_revenue', {
				user_id: user.id,
				date_from: from || null,
				date_to: to || null,
				group_by: groupBy
			})

		const [paymentResult, recurringResult, oneTimeResult] = await Promise.all([
			paymentRevenueQuery,
			recurringRevenueQuery,
			oneTimeRevenueQuery
		])

		if (paymentResult.error || recurringResult.error || oneTimeResult.error) {
			console.error('Revenue aggregation errors:', { paymentError: paymentResult.error, recurringError: recurringResult.error, oneTimeError: oneTimeResult.error })
			return NextResponse.json({ error: 'Failed to aggregate revenue' }, { status: 500 })
		}

		// Merge results by period
		const revenueMap = new Map()

		// Helper to add revenue to map
		const addRevenue = (rows: any[], source: string) => {
			rows.forEach(row => {
				const key = row.period
				const existing = revenueMap.get(key) || { period: key, total_revenue_minor: 0, sources: {} }
				existing.total_revenue_minor += row.amount_minor || 0
				existing.sources[source] = (existing.sources[source] || 0) + (row.amount_minor || 0)
				revenueMap.set(key, existing)
			})
		}

		addRevenue(paymentResult.data || [], 'payment_schedules')
		addRevenue(recurringResult.data || [], 'recurring_revenue')
		addRevenue(oneTimeResult.data || [], 'one_time_invoices')

		// Convert to sorted array
		const revenue = Array.from(revenueMap.values())
			.sort((a, b) => a.period.localeCompare(b.period))

		return NextResponse.json({ revenue }, { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } })
	} catch (e: any) {
		console.error('Revenue report error:', e)
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}
