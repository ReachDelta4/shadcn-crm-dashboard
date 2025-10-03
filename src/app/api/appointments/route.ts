import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'

const querySchema = z.object({
	from: z.string().optional(),
	to: z.string().optional(),
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

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { searchParams } = new URL(request.url)
		const parsed = querySchema.safeParse({ from: searchParams.get('from'), to: searchParams.get('to') })
		if (!parsed.success) return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
		const repo = new LeadAppointmentsRepository(supabase)
		const appointments = await repo.listUpcomingBetween(user.id, parsed.data.from, parsed.data.to)
		return NextResponse.json({ appointments }, { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=60' } })
	} catch (e) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
} 
