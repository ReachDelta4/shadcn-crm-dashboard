import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ProductPaymentPlansRepository } from '@/server/repositories/product-payment-plans'
import { getUserAndScope } from '@/server/auth/getUserAndScope'

const planCreateSchema = z.object({
	name: z.string().min(1),
	num_installments: z.number().int().min(1),
	interval_type: z.enum(['weekly', 'monthly', 'quarterly', 'semiannual', 'annual', 'custom_days']),
	interval_days: z.number().int().min(1).optional(),
	down_payment_minor: z.number().int().min(0).default(0),
	active: z.boolean().default(true),
})

async function getServerClient() {
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() { return cookieStore.getAll() },
				setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
			},
		}
	)
}

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { id } = await params
		const repo = new ProductPaymentPlansRepository()
		const plans = await repo.listByProduct(id)

		return NextResponse.json({ plans })
	} catch (error) {
		console.error('[plans] GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { id: productId } = await params
		const body = await request.json()
		const validated = planCreateSchema.parse(body)

		const repo = new ProductPaymentPlansRepository()
		const plan = await repo.create({
			product_id: productId,
			...validated,
		})

		return NextResponse.json({ plan }, { status: 201 })
	} catch (error) {
		console.error('[plans] POST error:', error)
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
