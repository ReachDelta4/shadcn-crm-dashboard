import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { ProductsRepository } from '@/server/repositories/products'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const createSchema = z.object({
	org_id: z.string().uuid().optional(),
	name: z.string().min(1),
	sku: z.string().optional(),
	currency: z.string().optional(),
	price_minor: z.number().int().nonnegative(),
	tax_rate_bp: z.number().int().min(0).max(10000).optional(),
	cogs_type: z.enum(['percent','amount']).nullable().optional(),
	cogs_value: z.number().int().nonnegative().nullable().optional(),
	discount_type: z.enum(['percent','amount']).nullable().optional(),
	discount_value: z.number().int().nonnegative().nullable().optional(),
	recurring_interval: z.enum(['weekly','monthly','quarterly','semiannual','annual','custom_days']).nullable().optional(),
	recurring_interval_days: z.number().int().min(1).nullable().optional(),
	active: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
	try {
		const scope = await getUserAndScope()
		const cookieStore = await cookies()
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() { return cookieStore.getAll() },
					setAll() { /* server route no-op */ },
				},
			}
		)
		const repo = new ProductsRepository(supabase)

		const { searchParams } = new URL(request.url)
		const search = searchParams.get('search') || undefined
		const activeParam = searchParams.get('active') || undefined
		const active = activeParam === undefined ? true : (activeParam === 'all' ? 'all' : activeParam === 'true')
		const page = Number(searchParams.get('page') || '0')
		const pageSize = Number(searchParams.get('pageSize') || '20')

		const result = await repo.list({ ownerId: scope.userId, role: scope.role, orgId: scope.orgId || null, active, search, page, pageSize })
		return NextResponse.json(result)
	} catch (error) {
		console.error('[products] GET error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const scope = await getUserAndScope()
		const cookieStore = await cookies()
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() { return cookieStore.getAll() },
					setAll() { /* server route no-op */ },
				},
			}
		)
		const repo = new ProductsRepository(supabase)
		const body = await request.json()
		const parsed = createSchema.safeParse(body)
		if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })

		const created = await repo.create(parsed.data, scope.userId, scope.orgId || null, scope.role)
		return NextResponse.json({ product: created }, { status: 201 })
	} catch (error) {
		console.error('[products] POST error:', error)
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
