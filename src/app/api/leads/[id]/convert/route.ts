import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { convertLeadToCustomerService } from '@/server/services/lead-conversion'

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

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id } = await params
		const { customerId, lead } = await convertLeadToCustomerService(supabase as any, id, user.id)

		// Log activity (best-effort)
		import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
			await logActivity(supabase as any, user.id, {
				type: 'lead',
				description: `Lead converted to customer: ${lead.full_name}`,
				entity: lead.email,
				details: { lead_id: id, customer_id: customerId }
			})
		}).catch(() => {})

		return NextResponse.json({ success: true, customerId })
	} catch (error) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
