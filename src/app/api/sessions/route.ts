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

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { searchParams } = new URL(request.url)
		const page = parseInt(searchParams.get('page') || '1')
		const pageSize = parseInt(searchParams.get('pageSize') || '10')
		const search = searchParams.get('search') || undefined
		const status = searchParams.get('status') || 'all'
		const type = searchParams.get('type') || undefined
		const dateFrom = searchParams.get('dateFrom') || undefined
		const dateTo = searchParams.get('dateTo') || undefined
		const sort = searchParams.get('sort') || 'created_at'
		const direction = (searchParams.get('direction') || 'desc') as 'asc' | 'desc'

		const repository = new SessionsRepository(supabase)
		const result = await repository.findAll({
			filters: { search, status: status as any, type, dateFrom, dateTo },
			sort,
			direction,
			page,
			pageSize,
			userId: user.id
		})
		return NextResponse.json(result)
	} catch (error) {
		console.error('Sessions API error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		const repository = new SessionsRepository(supabase)
		const session = await repository.create(body, user.id)
		return NextResponse.json(session, { status: 201 })
	} catch (error) {
		console.error('Session creation error:', error)
		return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
	}
}
