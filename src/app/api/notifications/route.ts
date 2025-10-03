import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const markReadSchema = z.object({
	notification_ids: z.array(z.string().uuid()).optional(),
	mark_all: z.boolean().optional(),
})

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

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { searchParams } = new URL(request.url)
		const unreadOnly = searchParams.get('unread') === 'true'
		const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)

		let query = supabase
			.from('notifications')
			.select('*', { count: 'exact' })
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (unreadOnly) {
			query = query.eq('read', false)
		}

		const { data, error, count } = await query

		if (error) throw error

		return NextResponse.json({ notifications: data || [], count: count || 0 })
	} catch (error) {
		console.error('[notifications] GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		const parsed = markReadSchema.parse(body)

		if (parsed.mark_all) {
			// Mark all unread as read
			const { error } = await supabase
				.from('notifications')
				.update({ read: true })
				.eq('user_id', user.id)
				.eq('read', false)
			
			if (error) throw error
			return NextResponse.json({ success: true })
		}

		if (parsed.notification_ids && parsed.notification_ids.length > 0) {
			// Mark specific notifications as read
			const { error } = await supabase
				.from('notifications')
				.update({ read: true })
				.eq('user_id', user.id)
				.in('id', parsed.notification_ids)

			if (error) throw error
			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		console.error('[notifications] PATCH error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
