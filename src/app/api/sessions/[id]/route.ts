import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SessionsRepository } from '@/server/repositories/sessions'

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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { id } = await params
		// Verify user is authenticated
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const repository = new SessionsRepository(supabase)
		const session = await repository.findById(id, user.id)
		if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
		return NextResponse.json(session)
	} catch (error) {
		console.error('Session fetch error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { id } = await params
		// Verify user is authenticated
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		const repository = new SessionsRepository(supabase)
		const session = await repository.update(id, body, user.id)
		// Log activity on end (best-effort)
		import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
			const ending = (body as any)?.status === 'completed' || (body as any)?.status === 'cancelled'
			if (ending) {
				await logActivity(supabase as any, user.id, {
					type: 'user',
					description: `Session ended`,
					entity: id,
					details: { id }
				})
			}
		}).catch(() => {})
				// Trigger report generation on session end (idempotent, async)
		try {
			const ending = (body as any)?.status === 'completed' || (body as any)?.status === 'cancelled'
				if (ending) {
					const origin = new URL(request.url).origin
					// In-app preferred: trigger Summary + Chance-of-Sale separately
					fetch(origin + '/api/sessions/' + id + '/summary', { method: 'POST' }).catch(() => {})
					fetch(origin + '/api/sessions/' + id + '/chance-of-sale', { method: 'POST' }).catch(() => {})
				}
		} catch {}
		return NextResponse.json(session)
	} catch (error) {
		console.error('Session update error:', error)
		return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { id } = await params
		// Verify user is authenticated
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const repository = new SessionsRepository(supabase)
		await repository.delete(id, user.id)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Session deletion error:', error)
		return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
	}
}



