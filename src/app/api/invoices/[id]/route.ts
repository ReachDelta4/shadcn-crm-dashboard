import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { InvoicesRepository } from '@/server/repositories/invoices'
import { InvoiceLinesRepository } from '@/server/repositories/invoice-lines'
import { InvoicePaymentSchedulesRepository } from '@/server/repositories/invoice-schedules'
import { convertLeadToCustomerService } from '@/server/services/lead-conversion'
import { LeadsRepository } from '@/server/repositories/leads'

const invoiceUpdateSchema = z.object({
	customer_name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	amount: z.coerce.number().min(0).optional(),
    status: z.enum(['draft','sent','pending','paid','overdue','cancelled']).optional(),
	date: z.string().optional(),
	due_date: z.string().optional(),
	items: z.coerce.number().min(0).optional(),
	payment_method: z.string().optional(),
	complete_draft: z.boolean().optional(),
	// Enable updating phone and lead linkage
	phone: z.string().optional(),
	lead_id: z.string().uuid().nullish().transform(v => v ?? undefined).optional(),
})

async function getServerClient() {
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
				},
			},
		}
	)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await getServerClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const { id } = await params
	// UUID guard to avoid DB cast errors
	if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 })
	}
	const repo = new InvoicesRepository(supabase)
	const invoice = await repo.getById(id, user.id)
	if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json(invoice)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id } = await params
		// UUID guard
		if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
			return NextResponse.json({ error: 'Not found' }, { status: 404 })
		}
		const body = await request.json()
		const validated = invoiceUpdateSchema.parse(body)
		const repo = new InvoicesRepository(supabase)

		// Fetch current invoice
		const current = await repo.getById(id, user.id)
		if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

		// Draft completion guard
		if ((validated as any).complete_draft) {
			// Minimal required fields to complete draft
			if (!current.customer_name && !(validated as any).customer_name) {
				return NextResponse.json({ error: 'Customer name required to complete draft' }, { status: 400 })
			}
			if (!current.email && !(validated as any).email) {
				return NextResponse.json({ error: 'Email required to complete draft' }, { status: 400 })
			}
			if (!current.amount && !(validated as any).amount) {
				return NextResponse.json({ error: 'Amount required to complete draft' }, { status: 400 })
			}
			(validated as any).status = (validated as any).status || 'pending'
		}

		// Apply base updates (including phone/lead_id if provided)
		const updated = await repo.update(id, validated as any, user.id)

		// If linked to a lead now (or changed), auto-convert lead and attach invoice to that customer
		if ((validated as any).lead_id) {
			try {
				const leadsRepo = new LeadsRepository()
				const lead = await leadsRepo.getById((validated as any).lead_id, user.id)
				if (lead) {
					const { data: customerId, error: rpcErr } = await (supabase as any)
						.rpc('convert_lead_to_customer_v2', { lead_id: (lead as any).id, initial_status: 'pending' })
					if (!rpcErr && customerId) {
						await (supabase as any)
							.from('invoices')
							.update({ customer_id: customerId })
							.eq('id', id)
							.eq('owner_id', user.id)
					}
				}
			} catch {}
		}

		// If invoice is paid now, best-effort: mark schedules paid and ensure customer becomes active
		const latest = await repo.getById(id, user.id)
		if ((validated as any).status === 'paid') {
			try {
				const linesRepo = new InvoiceLinesRepository(supabase)
				const schedulesRepo = new InvoicePaymentSchedulesRepository(supabase)
				const lines = await linesRepo.findByInvoiceId(id)
				if (lines.length > 0) {
					await (supabase as any)
						.from('invoice_payment_schedules')
						.update({ status: 'paid' })
						.eq('invoice_id', id)
						.eq('status', 'pending')
				}
				// Customer activation
				const customerId = (latest as any)?.customer_id
				if (customerId) {
					await (supabase as any)
						.from('customers')
						.update({ status: 'active' })
						.eq('id', customerId)
						.eq('owner_id', user.id)
						.in('status', ['pending'])
				}
			} catch {
				// swallow errors for best-effort consistency
			}
		}

		return NextResponse.json(latest)
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await getServerClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const { id } = await params
	// UUID guard
	if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
		return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
	}
	const repo = new InvoicesRepository(supabase)
	await repo.delete(id, user.id)
	return NextResponse.json({ success: true })
}
