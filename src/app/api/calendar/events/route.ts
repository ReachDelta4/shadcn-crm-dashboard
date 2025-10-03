import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { normalizeAppointments, normalizePaymentSchedules, normalizeRecurringSchedules, type CalendarEvent } from '@/features/calendar/lib/normalize'

const querySchema = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
	limit: z.coerce.number().min(1).max(2000).optional(),
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

		const from = parsed.data.from || undefined
		const to = parsed.data.to || undefined
		const limit = parsed.data.limit ?? 1000

		// 1) Appointments via repository (owner scoped)
		const apptsRepo = new LeadAppointmentsRepository(supabase)
		const appointments = await apptsRepo.listUpcomingBetween(user.id, from, to, limit)
		const apptEvents = normalizeAppointments(appointments as any)

		// 2) Payment schedules (owner scoped via join on invoices)
		const payQuery = supabase
			.from('invoice_payment_schedules')
			.select('id, invoice_id, invoice_line_id, installment_num, due_at_utc, amount_minor, description, status, invoices!inner(owner_id)')
			.order('due_at_utc', { ascending: true })
			.limit(limit)
			.eq('invoices.owner_id', user.id)
		if (from) payQuery.gte('due_at_utc', from)
		if (to) payQuery.lte('due_at_utc', to)
		const payRes = await payQuery
		const paymentSchedules = (payRes.data || []).map((row: any) => ({
			id: row.id,
			invoice_id: row.invoice_id,
			invoice_line_id: row.invoice_line_id,
			due_at_utc: row.due_at_utc,
			amount_minor: row.amount_minor,
			description: row.description,
			status: row.status,
		}))
		const payEvents = normalizePaymentSchedules(paymentSchedules as any)

		// 3) Recurring revenue schedules (owner scoped via join on invoice_lines->invoices)
		const recQuery = supabase
			.from('recurring_revenue_schedules')
			.select('id, invoice_line_id, cycle_num, billing_at_utc, amount_minor, description, status, invoice_lines!inner(invoice_id), invoices!invoice_lines_invoice_id_fkey!inner(owner_id)')
			.order('billing_at_utc', { ascending: true })
			.limit(limit)
			.eq('invoices.owner_id', user.id)
		if (from) recQuery.gte('billing_at_utc', from)
		if (to) recQuery.lte('billing_at_utc', to)
		const recRes = await recQuery
		const recurringSchedules = (recRes.data || []).map((row: any) => ({
			id: row.id,
			invoice_line_id: row.invoice_line_id,
			billing_at_utc: row.billing_at_utc,
			amount_minor: row.amount_minor,
			description: row.description,
			status: row.status,
		}))
		const recEvents = normalizeRecurringSchedules(recurringSchedules as any)

		const merged: CalendarEvent[] = [...apptEvents, ...payEvents, ...recEvents]
		return NextResponse.json({ events: merged }, { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' } })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}
