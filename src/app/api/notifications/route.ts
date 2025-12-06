import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ZodError } from 'zod'
import { markNotifications, listNotifications, markReadSchema } from '@/server/notifications/handlers'

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

		const result = await listNotifications({ supabase, userId: user.id, unreadOnly, limit })
		return NextResponse.json(result)
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

		await markNotifications({
			supabase,
			userId: user.id,
			notificationIds: parsed.notification_ids,
			markAll: parsed.mark_all,
		})

		return NextResponse.json({ success: true })
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		console.error('[notifications] PATCH error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
