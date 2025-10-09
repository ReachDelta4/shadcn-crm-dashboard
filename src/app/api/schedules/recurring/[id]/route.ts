import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { RecurringRevenueSchedulesRepository } from '@/server/repositories/invoice-schedules'

async function getClient() {
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{ cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({name, value, options}) => cookieStore.set(name, value, options)) } }
	)
}

export async function PATCH(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await getClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { id } = await params
		const recRepo = new RecurringRevenueSchedulesRepository(supabase as any)
		const schedule = await recRepo.getById(id)
		if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

		// Owner check: ensure schedule is tied to an invoice owned by the user via invoice_lines -> invoices
		const { data: ownedCheck, error: ownedErr } = await (supabase as any)
			.from('recurring_revenue_schedules')
			.select('id, invoice_lines!inner(invoice_id), invoices!invoice_lines_invoice_id_fkey!inner(owner_id)')
			.eq('id', id)
			.eq('invoices.owner_id', user.id)
			.single()
		if (ownedErr || !ownedCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

		const when = new Date().toISOString()
		await recRepo.markBilled(id, when)
		return NextResponse.json({ success: true, billed_at: when })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}



