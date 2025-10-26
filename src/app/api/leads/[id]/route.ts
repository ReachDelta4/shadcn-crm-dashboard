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
	status: z.enum(['new','contacted','qualified','disqualified','converted']).optional(),
	source: z.string().optional(),
	date: z.string().optional(),
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
            // Use v2 conversion with initial pending status
            const { data: { user: authUser } } = await supabase.auth.getUser()
            if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            const { data: customerId, error: rpcErr } = await (supabase as any)
                .rpc('convert_lead_to_customer_v2', { lead_id: id, initial_status: 'pending' })
            if (rpcErr) return NextResponse.json({ error: rpcErr.message || 'Conversion failed' }, { status: 500 })
            const repo = new LeadsRepository(supabase)
            const lead = await repo.getById(id, user.id)
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
		// Update with validated canonical status if provided
		const updates = { ...validated } as any
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
