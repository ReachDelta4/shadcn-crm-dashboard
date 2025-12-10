import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { LeadsRepository } from '@/server/repositories/leads'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { leadSourceValues } from '@/features/leads/constants'
import { withIdempotency } from '@/server/utils/idempotency'
import { checkDuplicateContact } from '@/server/services/duplicate-contacts'

const leadCreateSchema = z.object({
	lead_number: z.string().optional(),
	full_name: z.string().min(1, 'Full name is required'),
	email: z.string().email('Valid email is required'),
	phone: z.string().min(1, 'Phone is required'),
	company: z.string().optional(),
	location: z.string().optional(),
	value: z.coerce.number().min(0).default(0).optional(),
	status: z.enum(['new','contacted','qualified','disqualified','converted']).default('new').optional(),
	source: z.enum(leadSourceValues as [string, ...string[]]).optional(),
	date: z.string().optional(),
})

const leadFiltersSchema = z.object({
	search: z.string().nullable().optional().transform(v => v ?? ''),
	status: z.enum(['all','new','contacted','qualified','disqualified','converted']).nullable().optional().transform(v => v ?? 'all'),
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
		let scope
		try {
			scope = await getUserAndScope()
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error)
			if (message === 'Unauthorized') {
				return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
			}
			throw error
		}
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
			filters: { search: filters.search || undefined, status: filters.status as any, dateFrom: filters.dateFrom, dateTo: filters.dateTo },
			sort: filters.sort,
			direction: filters.direction,
			page: filters.page,
			pageSize: filters.pageSize,
			userId: scope.userId,
			ownerIds: scope.allowedOwnerIds,
		})
		return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=120' } })
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		const message = error instanceof Error ? error.message : String(error)
		if (message.includes('leads_status_check')) {
			return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const scope = await getUserAndScope()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const body = await request.json()
		const validated = leadCreateSchema.parse(body)

		const dupResult = await checkDuplicateContact(supabase as any, {
			email: validated.email,
			phone: validated.phone,
			orgId: scope.orgId ?? undefined,
			ownerIds: scope.allowedOwnerIds,
		})
		if (dupResult.duplicateEmail || dupResult.duplicatePhone) {
			return NextResponse.json({
				error: dupResult.duplicateEmail ? 'Duplicate email' : 'Duplicate phone',
				code: dupResult.duplicateEmail ? 'duplicate_email' : 'duplicate_phone',
			}, { status: 409 })
		}

		const repo = new LeadsRepository(supabase)

		const idempotencyKeyHeader = request.headers.get('Idempotency-Key') || null
		const normalizedKey =
			idempotencyKeyHeader &&
			`${user.id}:lead:create:${validated.full_name.trim().toLowerCase()}:${validated.email.trim().toLowerCase()}:${(validated.company || '').trim().toLowerCase()}:${(validated.phone || '').trim()}`

		const lead = await withIdempotency(normalizedKey, async () => {
			const created = await repo.create({ ...validated, status: validated.status || 'new' }, user.id)

			// Log activity (best-effort)
			import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
				await logActivity(supabase as any, user.id, {
					type: 'lead',
					description: `Lead created: ${(created as any).full_name}`,
					entity: (created as any).email,
					details: { id: (created as any).id }
				})
			}).catch(() => {})

			return created
		})

		return NextResponse.json(lead, { status: 201 })
	} catch (error) {
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		const message = error instanceof Error ? error.message : String(error)
		if (message.includes('leads_status_check')) {
			return NextResponse.json({ error: 'Invalid lead status' }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
