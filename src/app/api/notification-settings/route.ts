import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ZodError } from 'zod'
import { getNotificationSettings, settingsUpdateSchema, updateNotificationSettings } from '@/server/notifications/handlers'

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

export async function GET(_request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const settings = await getNotificationSettings({ supabase, userId: user.id })
		return NextResponse.json(settings)
	} catch (error) {
		console.error('[notification-settings] GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		const updated = await updateNotificationSettings({ supabase, userId: user.id, payload: body })

		return NextResponse.json(updated)
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		console.error('[notification-settings] PATCH error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
