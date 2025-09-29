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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { id: subjectId } = await params
		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '10'), 100)
		const dateFrom = searchParams.get('dateFrom')
		const dateTo = searchParams.get('dateTo')

		// Verify subject ownership first
		const { data: subject, error: subjectError } = await supabase
			.from('crm_subjects')
			.select('id')
			.eq('id', subjectId)
			.eq('owner_id', user.id)
			.single()

		if (subjectError || !subject) {
			return NextResponse.json({ error: 'Subject not found or access denied' }, { status: 403 })
		}

		// Query sessions linked to this subject
		let query = supabase
			.from('sessions')
			.select('id, title_enc, session_type, started_at, ended_at, created_at, updated_at', { count: 'exact' })
			.eq('subject_id', subjectId)
			.eq('user_id', user.id)

		// Apply date filters
		if (dateFrom) {
			query = query.gte('started_at', dateFrom)
		}
		if (dateTo) {
			query = query.lte('started_at', dateTo)
		}

		// Apply pagination
		const from = (page - 1) * pageSize
		const to = from + pageSize - 1
		query = query
			.order('started_at', { ascending: false })
			.range(from, to)

		const { data: sessions, error: sessionsError, count } = await query

		if (sessionsError) {
			console.error('Sessions query error:', sessionsError)
			return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
		}

		// Format sessions
		const formattedSessions = (sessions || []).map(session => {
			const startedAt = session.started_at ? new Date(session.started_at) : null
			const fallbackTitle = startedAt ? `Session @ ${startedAt.toLocaleTimeString('en-GB', { hour12: false })}` : 'Session'
			const looksEncoded = typeof session.title_enc === 'string' && /^[A-Za-z0-9+/=]{20,}$/.test(session.title_enc)
			
			return {
				id: session.id,
				title: (session.title_enc && !looksEncoded) ? session.title_enc : fallbackTitle,
				type: session.session_type,
				status: session.ended_at ? 'completed' : 'active',
				started_at: session.started_at,
				ended_at: session.ended_at,
				created_at: session.created_at,
				updated_at: session.updated_at,
				duration: session.started_at && session.ended_at 
					? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 1000)
					: null
			}
		})

		const total = count || 0
		const totalPages = Math.ceil(total / pageSize)

		return NextResponse.json({
			sessions: formattedSessions,
			total,
			page,
			pageSize,
			totalPages
		})

	} catch (error) {
		console.error('Subject sessions error:', error)
		return NextResponse.json({ error: 'Failed to fetch subject sessions' }, { status: 500 })
	}
}
