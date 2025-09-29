import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options)
						)
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		}
	)
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		
		// Validate input format
		if (!body || typeof body !== 'object') {
			return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
		}
		
		const hasSubjectId = 'subject_id' in body && body.subject_id
		const hasCreateLead = 'create_lead' in body && body.create_lead
		
		if (!hasSubjectId && !hasCreateLead) {
			return NextResponse.json({ 
				error: 'Must provide either subject_id or create_lead payload' 
			}, { status: 400 })
		}
		
		if (hasCreateLead) {
			const { full_name, company } = body.create_lead
			if (!full_name?.trim() || !company?.trim()) {
				return NextResponse.json({ 
					error: 'full_name and company are required for create_lead' 
				}, { status: 400 })
			}
		}

		// Call the RPC
		const { data: result, error: rpcError } = await supabase
			.rpc('start_listen_session_with_subject', { p_subject_choice: body })
		
		if (rpcError) {
			console.error('RPC error:', rpcError)
			
			// Map specific error codes to user-friendly responses
			if (rpcError.message === 'duplicate_lead') {
				return NextResponse.json({ 
					error: 'A lead with this name and company already exists' 
				}, { status: 409 })
			}
			if (rpcError.message === 'subject_forbidden_or_not_found') {
				return NextResponse.json({ 
					error: 'Subject not found or access denied' 
				}, { status: 403 })
			}
			if (rpcError.message === 'unauthorized') {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
			}
			
			return NextResponse.json({ 
				error: 'Failed to start session', 
				details: rpcError.message 
			}, { status: 500 })
		}

		if (!result || result.length === 0) {
			return NextResponse.json({ error: 'No session created' }, { status: 500 })
		}

		const sessionResult = result[0]
		
		// Log activity (best-effort, matching existing /api/sessions behavior)
		import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
			await logActivity(supabase as any, user.id, {
				type: 'user',
				description: `Session started: listen${sessionResult.lead_id ? ' (new lead created)' : ''}`,
				entity: sessionResult.session_id,
				details: { 
					id: sessionResult.session_id,
					subject_id: sessionResult.subject_id,
					lead_id: sessionResult.lead_id
				}
			})
		}).catch(() => {})

		// Trigger V3 report generation (best-effort, fire-and-forget, matching existing behavior)
		import('../../[id]/report-v3/route').then(async (m) => {
			try {
				await fetch(`${new URL(request.url).origin}/api/sessions/${sessionResult.session_id}/report-v3`, { 
					method: 'POST' 
				})
			} catch {}
		}).catch(() => {})

		// Also trigger Tabs report generation (best-effort, fire-and-forget)
		import('../../[id]/report-v3-tabs/route').then(async () => {
			try {
				await fetch(`${new URL(request.url).origin}/api/sessions/${sessionResult.session_id}/report-v3-tabs`, { 
					method: 'POST' 
				})
			} catch {}
		}).catch(() => {})

		return NextResponse.json({
			session_id: sessionResult.session_id,
			subject_id: sessionResult.subject_id,
			lead_id: sessionResult.lead_id,
			type: 'listen',
			status: 'active'
		}, { status: 201 })

	} catch (error) {
		console.error('Session listen start error:', error)
		return NextResponse.json({ error: 'Failed to start listen session' }, { status: 500 })
	}
}


