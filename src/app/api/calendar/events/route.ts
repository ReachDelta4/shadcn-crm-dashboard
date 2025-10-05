import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { normalizeAppointments, normalizePaymentSchedules, normalizeRecurringSchedules, type CalendarEvent } from '@/features/calendar/lib/normalize'
import { startOfMonth, endOfMonth, isValid as isValidDate, parseISO } from 'date-fns'

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

function sanitizeRange(fromRaw?: string | null, toRaw?: string | null): { from: string; to: string } {
	// Default to current month
	const now = new Date()
	let fromDate = startOfMonth(now)
	let toDate = endOfMonth(now)
	if (fromRaw) {
		const d = parseISO(fromRaw)
		if (isValidDate(d)) fromDate = d
	}
	if (toRaw) {
		const d = parseISO(toRaw)
		if (isValidDate(d)) toDate = d
	}
	// Ensure from < to; if invalid order, reset to current month
	if (!(fromDate instanceof Date) || !(toDate instanceof Date) || !(fromDate.getTime() < toDate.getTime())) {
		fromDate = startOfMonth(now)
		toDate = endOfMonth(now)
	}
	return { from: fromDate.toISOString(), to: toDate.toISOString() }
}

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ events: [] }, { status: 401 })

		const { searchParams } = new URL(request.url)
		const parsed = querySchema.safeParse({ from: searchParams.get('from'), to: searchParams.get('to'), limit: searchParams.get('limit') })
		// If parse fails, still continue with safe defaults
		const rawFrom = parsed.success ? parsed.data.from : searchParams.get('from')
		const rawTo = parsed.success ? parsed.data.to : searchParams.get('to')
		const limit = parsed.success && parsed.data.limit ? Math.min(Math.max(parsed.data.limit, 1), 2000) : 1000

		const { from, to } = sanitizeRange(rawFrom, rawTo)

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
			.gte('due_at_utc', from)
			.lte('due_at_utc', to)
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
			.gte('billing_at_utc', from)
			.lte('billing_at_utc', to)
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
		// Return empty events array on unexpected errors to avoid breaking UI
		return NextResponse.json({ events: [], error: e?.message || 'Internal server error' }, { status: 200 })
	}
}
