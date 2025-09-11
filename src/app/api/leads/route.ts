import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { LeadsRepository } from '@/server/repositories/leads'

const leadCreateSchema = z.object({
	lead_number: z.string().optional(),
	full_name: z.string().min(1, 'Full name is required'),
	email: z.string().email('Valid email is required'),
	phone: z.string().optional(),
	company: z.string().optional(),
	value: z.coerce.number().min(0).default(0),
	status: z.enum(['new','contacted','qualified','unqualified','converted']).default('new'),
	source: z.string().optional(),
	date: z.string().optional(),
})

const leadFiltersSchema = z.object({
	search: z.string().nullable().optional().transform(v => v ?? ''),
	status: z.enum(['all','new','contacted','qualified','unqualified','converted']).nullable().optional().transform(v => v ?? 'all'),
	dateFrom: z.string().nullable().optional().transform(v => v ?? undefined),
	dateTo: z.string().nullable().optional().transform(v => v ?? undefined),
	sort: z.string().nullable().optional().transform(v => v ?? 'date'),
	direction: z.enum(['asc','desc']).nullable().optional().transform(v => v ?? 'desc'),
	page: z.coerce.number().min(0).nullable().optional().transform(v => (v == null ? 0 : v)),
	pageSize: z.coerce.number().min(1).max(100).nullable().optional().transform(v => (v == null ? 10 : v)),
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
		const filters = leadFiltersSchema.parse({
			search: searchParams.get('search'),
			status: searchParams.get('status'),
			dateFrom: searchParams.get('dateFrom'),
			dateTo: searchParams.get('dateTo'),
			sort: searchParams.get('sort'),
			direction: searchParams.get('direction'),
			page: searchParams.get('page'),
			pageSize: searchParams.get('pageSize'),
		})
		const repo = new LeadsRepository(supabase)
		const result = await repo.list({
			filters: { search: filters.search || undefined, status: filters.status, dateFrom: filters.dateFrom, dateTo: filters.dateTo },
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
		const validated = leadCreateSchema.parse(body)
		const repo = new LeadsRepository(supabase)
		const lead = await repo.create(validated, user.id)
		return NextResponse.json(lead, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
