import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { ProductsRepository } from '@/server/repositories/products'

const updateSchema = z.object({
	org_id: z.string().uuid().optional(),
	name: z.string().min(1).optional(),
	sku: z.string().optional(),
	currency: z.string().optional(),
	price_minor: z.number().int().nonnegative().optional(),
	tax_rate_bp: z.number().int().min(0).max(10000).optional(),
	cogs_type: z.enum(['percent','amount']).nullable().optional(),
	cogs_value: z.number().int().nonnegative().nullable().optional(),
	discount_type: z.enum(['percent','amount']).nullable().optional(),
	discount_value: z.number().int().nonnegative().nullable().optional(),
	recurring_interval: z.enum(['weekly','monthly','quarterly','semiannual','annual','custom_days']).nullable().optional(),
	recurring_interval_days: z.number().int().min(1).nullable().optional(),
	active: z.boolean().optional(),
})

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id } = await params
		const repo = new ProductsRepository()
		const product = await repo.getById(id, scope.orgId || null, scope.userId, scope.role)
		if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return NextResponse.json({ product })
	} catch (error) {
		console.error('[products/:id] GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id } = await params
		const body = await request.json()
		const parsed = updateSchema.safeParse(body)
		if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
		const repo = new ProductsRepository()
		const updated = await repo.update(id, parsed.data, scope.userId, scope.orgId || null, scope.role)
		return NextResponse.json({ product: updated })
	} catch (error) {
		console.error('[products/:id] PATCH error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id } = await params
		const repo = new ProductsRepository()
		await repo.delete(id, scope.userId, scope.orgId || null, scope.role)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('[products/:id] DELETE error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
