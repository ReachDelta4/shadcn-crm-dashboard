import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { LeadsRepository } from '@/server/repositories/leads'
import { convertLeadToCustomerService } from '@/server/services/lead-conversion'

const leadUpdateSchema = z.object({
	full_name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	company: z.string().optional(),
	value: z.coerce.number().min(0).optional(),
	status: z.enum([
		'new',
		'contacted',
		'qualified',
		'unqualified', // legacy -> lost
		'demo_appointment',
		'proposal_negotiation',
		'invoice_sent',
		'won',
		'lost',
		'converted' // legacy -> won
	]).optional(),
	source: z.string().optional(),
	date: z.string().optional(),
})

function toCanonicalStatus(input: string): string {
	if (input === 'unqualified') return 'lost'
	if (input === 'converted') return 'won'
	return input
}

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
	const repo = new LeadsRepository(supabase)
	const lead = await repo.getById(id, user.id)
	if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json(lead)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id } = await params
		const body = await request.json()
		const validated = leadUpdateSchema.parse(body)
		const repo = new LeadsRepository(supabase)
		if ((validated as any).status === 'converted') {
			const { customerId, lead } = await convertLeadToCustomerService(supabase as any, id, user.id)
			import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
				await logActivity(supabase as any, user.id, {
					type: 'lead',
					description: `Lead converted to customer`,
					entity: (lead as any)?.email,
					details: { id, customer_id: customerId }
				})
			}).catch(() => {})
			return NextResponse.json(lead)
		}
		// Canonicalize status on update
		const updates = { ...validated } as any
		if (updates.status) updates.status = toCanonicalStatus(updates.status)
		const lead = await repo.update(id, updates, user.id)
		import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
			const status = (updates as any).status
			if (status) {
				await logActivity(supabase as any, user.id, {
					type: 'lead',
					description: `Lead status changed to ${status}`,
					entity: (lead as any).email,
					details: { id }
				})
			}
		}).catch(() => {})
		return NextResponse.json(lead)
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
	const repo = new LeadsRepository(supabase)
	await repo.delete(id, user.id)
	// Log activity (best-effort)
	import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
		await logActivity(supabase as any, user.id, {
			type: 'lead',
			description: `Lead deleted`,
			entity: id,
			details: { id }
		})
	}).catch(() => {})
	return NextResponse.json({ success: true })
}
