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

		// Idempotent: already paid
		if ((schedule as any).status === 'paid') {
			return NextResponse.json({ success: true, paid_at: (schedule as any).paid_at || (schedule as any).due_at_utc }, { status: 409 })
		}

		// Owner check: ensure schedule belongs to an invoice owned by the user
		const { data: ownedCheck, error: ownedErr } = await (supabase as any)
			.from('invoice_payment_schedules')
			.select('id, invoices!inner(owner_id)')
			.eq('id', id)
			.eq('invoices.owner_id', user.id)
			.single()
		if (ownedErr || !ownedCheck) return NextResponse.json({ error: 'Not found' }, { status: 404 })

		// mark paid atomically and cascade invoice if last schedule
		const when = new Date().toISOString()
    const rpcCall = (supabase as any)
      .rpc('mark_schedule_paid_cascade', { p_schedule_id: id, p_paid_at: when })
    const rpcResult = typeof (rpcCall as any)?.single === 'function'
      ? await (rpcCall as any).single()
      : await rpcCall
    const cascadeRes = rpcResult?.data
    const cascadeErr = rpcResult?.error
    if (cascadeErr) {
      return NextResponse.json({ error: cascadeErr.message || 'Failed to mark paid' }, { status: 500 })
    }

    // If invoice is fully paid now, ensure conversion to paying customer
    if (cascadeRes?.invoice_paid) {
      try {
        await (supabase as any).rpc('ensure_paying_customer_for_invoice', { p_invoice_id: (cascadeRes as any).invoice_id })
      } catch {}
    }

    return NextResponse.json({ success: true, paid_at: when, invoice_paid: !!cascadeRes?.invoice_paid })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}
