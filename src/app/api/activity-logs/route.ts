import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ActivityLogsRepository } from '@/server/repositories/activity-logs'

const logCreateSchema = z.object({
	type: z.enum(['user','contact','lead','deal','task','email']),
	description: z.string().min(1),
	user: z.string().min(1),
	entity: z.string().optional(),
	timestamp: z.string().optional(),
	details: z.record(z.any()).optional(),
})

const logFiltersSchema = z.object({
	type: z.enum(['all','user','contact','lead','deal','task','email']).nullable().optional().transform(v => v ?? 'all'),
	search: z.string().nullable().optional().transform(v => v ?? ''),
	dateFrom: z.string().nullable().optional().transform(v => v ?? undefined),
	dateTo: z.string().nullable().optional().transform(v => v ?? undefined),
	sort: z.string().nullable().optional().transform(v => v ?? 'timestamp'),
	direction: z.enum(['asc','desc']).nullable().optional().transform(v => v ?? 'desc'),
	page: z.coerce.number().min(0).nullable().optional().transform(v => (v == null ? 0 : v)),
	pageSize: z.coerce.number().min(1).max(200).nullable().optional().transform(v => (v == null ? 50 : v)),
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
		const filters = logFiltersSchema.parse({
			type: searchParams.get('type'),
			search: searchParams.get('search'),
			dateFrom: searchParams.get('dateFrom'),
			dateTo: searchParams.get('dateTo'),
			sort: searchParams.get('sort'),
			direction: searchParams.get('direction'),
			page: searchParams.get('page'),
			pageSize: searchParams.get('pageSize'),
		})
		const repo = new ActivityLogsRepository(supabase)
		const result = await repo.list({
			filters: { type: filters.type, search: filters.search || undefined, dateFrom: filters.dateFrom, dateTo: filters.dateTo },
			sort: filters.sort,
			direction: filters.direction,
			page: filters.page,
			pageSize: filters.pageSize,
			userId: user.id,
		})
		return NextResponse.json(result)
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const body = await request.json()
		const validated = logCreateSchema.parse(body)
		const repo = new ActivityLogsRepository(supabase)
		const log = await repo.create(validated, user.id)
		return NextResponse.json(log, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
