import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { logLeadTransition, logLeadError } from '@/server/services/logging/lead-logger'

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

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id: leadId } = await params
		const repo = new LeadStatusTransitionsRepository(supabase as any)
		const list = await repo.findByLeadId(leadId, 100)
		logLeadTransition({
			operation: 'transitions_fetch',
			leadId,
			userId: user.id,
			source: 'api.leads.transitions',
		})
		return NextResponse.json({
			transitions: list.map(t => ({
				at: t.created_at,
				from: t.status_from,
				to: t.status_to,
				by: t.actor_id,
			})),
		})
	} catch (e) {
		logLeadError({
			operation: 'transitions_fetch',
			source: 'api.leads.transitions',
			code: 'internal_error',
			error: e,
		})
		return NextResponse.json({ error: 'Internal server error', code: 'internal_error' }, { status: 500 })
	}
}


