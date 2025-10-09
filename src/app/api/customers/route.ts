import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { CustomersRepository, customersRepository } from '@/server/repositories/customers'

// Input validation schemas
const customerCreateSchema = z.object({
	customer_number: z.string().optional(),
	full_name: z.string().min(1, 'Full name is required'),
	email: z.string().email('Valid email is required'),
	phone: z.string().optional(),
	company: z.string().optional(),
	location: z.string().optional(),
    status: z.enum(['active', 'inactive', 'pending', 'churned']).default('active'),
})

const customerFiltersSchema = z.object({
	search: z.string().nullable().optional().transform(v => v ?? ''),
    status: z.enum(['all', 'active', 'inactive', 'pending', 'churned']).nullable().optional().transform(v => v ?? 'all'),
	dateFrom: z.string().nullable().optional().transform(v => v ?? undefined),
	dateTo: z.string().nullable().optional().transform(v => v ?? undefined),
	sort: z.string().nullable().optional().transform(v => v ?? 'date_joined'),
	direction: z.enum(['asc', 'desc']).nullable().optional().transform(v => v ?? 'desc'),
	page: z.coerce.number().min(0).nullable().optional().transform(v => (v == null ? 0 : v)),
	pageSize: z.coerce.number().min(1).max(100).nullable().optional().transform(v => (v == null ? 10 : v)),
})

async function getServerClient() {
	const cookieStore = await cookies()
	const supabase = createServerClient(
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
	return supabase
}

async function getAuthenticatedUser(request: NextRequest) {
	const supabase = await getServerClient()
	const { data: { user }, error } = await supabase.auth.getUser()
	if (error || !user) {
		throw new Error('Unauthorized')
	}
	return { user, supabase }
}

export async function GET(request: NextRequest) {
	try {
		const { user, supabase } = await getAuthenticatedUser(request)
		const { searchParams } = new URL(request.url)
		
		const filters = customerFiltersSchema.parse({
			search: searchParams.get('search'),
			status: searchParams.get('status'),
			dateFrom: searchParams.get('dateFrom'),
			dateTo: searchParams.get('dateTo'),
			sort: searchParams.get('sort'),
			direction: searchParams.get('direction'),
			page: searchParams.get('page'),
			pageSize: searchParams.get('pageSize'),
		})

		const repo = new CustomersRepository(supabase)
		const result = await repo.list({
			filters: {
				search: filters.search || undefined,
				status: filters.status,
				dateFrom: filters.dateFrom,
				dateTo: filters.dateTo,
			},
			sort: filters.sort,
			direction: filters.direction,
			page: filters.page,
			pageSize: filters.pageSize,
			userId: user.id,
		})

		return NextResponse.json(result)
	} catch (error) {
		console.error('GET /api/customers error:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation failed', details: error.errors },
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function POST(request: NextRequest) {
	try {
		const { user, supabase } = await getAuthenticatedUser(request)
		const body = await request.json()
		
		const validatedData = customerCreateSchema.parse(body)
		
		const repo = new CustomersRepository(supabase)
		const customer = await repo.create(validatedData, user.id)
		// Log activity (best-effort)
		import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
			await logActivity(supabase as any, user.id, {
				type: 'deal',
				description: `Customer created: ${(customer as any).full_name}`,
				entity: (customer as any).email,
				details: { id: (customer as any).id }
			})
		}).catch(() => {})
		return NextResponse.json(customer, { status: 201 })
	} catch (error) {
		console.error('POST /api/customers error:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation failed', details: error.errors },
				{ status: 400 }
			)
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
