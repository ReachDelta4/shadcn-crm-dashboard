import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'

const settingsUpdateSchema = z.object({
	inapp: z.boolean().optional(),
	email: z.boolean().optional(),
	push: z.boolean().optional(),
	reminder_24h: z.boolean().optional(),
	reminder_1h: z.boolean().optional(),
	calendar_provider: z.enum(['google','outlook','none']).optional(),
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

export async function GET(_request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { data } = await supabase
			.from('notification_settings')
			.select('*')
			.eq('owner_id', user.id)
			.maybeSingle()

		// Return defaults if no settings exist
		const settings = data || {
			inapp: true,
			email: false,
			push: false,
			reminder_24h: true,
			reminder_1h: true,
			calendar_provider: 'none',
		}

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
		const parsed = settingsUpdateSchema.parse(body)

		// Upsert settings
		const { data, error } = await supabase
			.from('notification_settings')
			.upsert({
				owner_id: user.id,
				...parsed,
				updated_at: new Date().toISOString(),
			}, {
				onConflict: 'owner_id'
			})
			.select()
			.single()

		if (error) throw error

		return NextResponse.json(data)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		console.error('[notification-settings] PATCH error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
