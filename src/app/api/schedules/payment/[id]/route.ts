import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { InvoicePaymentSchedulesRepository } from '@/server/repositories/invoice-schedules'
import { InvoicesRepository } from '@/server/repositories/invoices'

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
		const schedulesRepo = new InvoicePaymentSchedulesRepository(supabase as any)
		const schedule = await schedulesRepo.getById(id)
		if (!schedule) return NextResponse.json({ error: 'Not found' }, { status: 404 })

		// mark paid
		const when = new Date().toISOString()
		await schedulesRepo.markPaid(id, when)

		// if all schedules for the invoice are paid, set invoice paid
		const unpaid = await schedulesRepo.countUnpaidByInvoiceId(schedule.invoice_id)
		if (unpaid === 0) {
			const invoicesRepo = new InvoicesRepository(supabase as any)
			await invoicesRepo.update(schedule.invoice_id, { status: 'paid', paid_at: when } as any, user.id)
		}

		return NextResponse.json({ success: true, paid_at: when })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}


