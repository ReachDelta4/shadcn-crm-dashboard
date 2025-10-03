import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { InvoicePaymentSchedulesRepository, RecurringRevenueSchedulesRepository } from '@/server/repositories/invoice-schedules'
import { normalizeAppointments, normalizePaymentSchedules, normalizeRecurringSchedules } from '@/features/calendar/lib/normalize'

const querySchema = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
	limit: z.coerce.number().min(1).max(1000).optional(),
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
		const parsed = querySchema.safeParse({ from: searchParams.get('from'), to: searchParams.get('to'), limit: searchParams.get('limit') })
		if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })

		const apptsRepo = new LeadAppointmentsRepository(supabase)
		const payRepo = new InvoicePaymentSchedulesRepository(supabase)
		const recRepo = new RecurringRevenueSchedulesRepository(supabase)

		// Fetch data within a sensible range; repositories can add owner_id scoping internally as needed
		const appointments = await apptsRepo.listUpcomingBetween(user.id, parsed.data.from, parsed.data.to)

		// For schedules, filter by date range if provided
		const from = parsed.data.from
		const to = parsed.data.to
		// Inline queries since repositories don't have date-range list methods yet
		const { data: paymentSchedules, error: payErr } = await (supabase as any)
			.from('invoice_payment_schedules')
			.select('id, invoice_id, invoice_line_id, installment_num, due_at_utc, amount_minor, description, status')
			.order('due_at_utc', { ascending: true })
			.filter('due_at_utc', from ? 'gte' : 'gte', from || '1970-01-01T00:00:00Z')
			.filter('due_at_utc', to ? 'lte' : 'lte', to || '2100-01-01T00:00:00Z')
		if (payErr) throw new Error(payErr.message)

		const { data: recurringSchedules, error: recErr } = await (supabase as any)
			.from('recurring_revenue_schedules')
			.select('id, invoice_line_id, cycle_num, billing_at_utc, amount_minor, description, status')
			.order('billing_at_utc', { ascending: true })
			.filter('billing_at_utc', from ? 'gte' : 'gte', from || '1970-01-01T00:00:00Z')
			.filter('billing_at_utc', to ? 'lte' : 'lte', to || '2100-01-01T00:00:00Z')
		if (recErr) throw new Error(recErr.message)

		const events = [
			...normalizeAppointments(appointments as any),
			...normalizePaymentSchedules((paymentSchedules || []) as any),
			...normalizeRecurringSchedules((recurringSchedules || []) as any),
		]

		return NextResponse.json({ events }, { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' } })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}
