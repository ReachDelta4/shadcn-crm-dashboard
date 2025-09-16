import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { TranscriptsRepository } from '@/server/repositories/transcripts'

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
		const pageSize = parseInt(searchParams.get('pageSize') || '50')
		const search = searchParams.get('search') || undefined
		const sessionId = searchParams.get('sessionId') || undefined
		const speaker = searchParams.get('speaker') || undefined
		const dateFrom = searchParams.get('dateFrom') || undefined
		const dateTo = searchParams.get('dateTo') || undefined
		const sort = searchParams.get('sort') || 'timestamp'
		const direction = (searchParams.get('direction') || 'asc') as 'asc' | 'desc'

		const repository = new TranscriptsRepository(supabase)
		
		// If sessionId is provided, return all transcripts for that session
		if (sessionId) {
			const transcripts = await repository.findBySessionId(sessionId, user.id)
			return NextResponse.json({
				transcripts,
				total: transcripts.length,
				page: 1,
				pageSize: transcripts.length,
				totalPages: 1
			})
		}
		
		const result = await repository.findAll({
			filters: { search, sessionId, speaker, dateFrom, dateTo },
			sort,
			direction,
			page,
			pageSize,
			userId: user.id
		})

		return NextResponse.json(result)
	} catch (error) {
		console.error('Transcripts API error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const body = await request.json()
		const repository = new TranscriptsRepository(supabase)
		const transcript = await repository.create(body, user.id)
		return NextResponse.json(transcript, { status: 201 })
	} catch (error) {
		console.error('Transcript creation error:', error)
		return NextResponse.json({ error: 'Failed to create transcript' }, { status: 500 })
	}
}
