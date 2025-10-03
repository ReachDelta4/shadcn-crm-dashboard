import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { ProductsRepository } from '@/server/repositories/products'
import { ProductPaymentPlansRepository } from '@/server/repositories/product-payment-plans'

const createPlanSchema = z.object({
	name: z.string().min(1),
	num_installments: z.number().int().min(1),
	interval_type: z.enum(['weekly','monthly','quarterly','semiannual','annual','custom_days']),
	interval_days: z.number().int().min(1).optional(),
	down_payment_minor: z.number().int().min(0).optional(),
	active: z.boolean().optional(),
})

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: productId } = await params
		const productsRepo = new ProductsRepository()
		const product = await productsRepo.getById(productId, scope.orgId || null, scope.userId, scope.role)
		if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		const plansRepo = new ProductPaymentPlansRepository()
		const plans = await plansRepo.listByProduct(productId, true)
		return NextResponse.json({ plans })
	} catch (error) {
		console.error('[product plans] GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		if (!['manager','executive','god'].includes(scope.role)) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}
		const { id: productId } = await params
		const productsRepo = new ProductsRepository()
		const product = await productsRepo.getById(productId, scope.orgId || null, scope.userId, scope.role)
		if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
		const body = await request.json()
		const parsed = createPlanSchema.safeParse(body)
		if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
		const plansRepo = new ProductPaymentPlansRepository()
		const created = await plansRepo.create({
			product_id: productId,
			org_id: scope.orgId || null,
			...parsed.data,
		})
		return NextResponse.json({ plan: created }, { status: 201 })
	} catch (error) {
		console.error('[product plans] POST error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
