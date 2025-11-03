import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { ProductsRepository } from '@/server/repositories/products'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
        const { id } = await params
        const repo = new ProductsRepository(supabase)
        const product = await repo.getById(id, scope.orgId || null, scope.userId, scope.role)
        if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ product })
    } catch (error) {
        console.error('[products/:id] GET error:', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params
        const body = await request.json()
        const parsed = updateSchema.safeParse(body)
        if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
        const repo = new ProductsRepository(supabase)
        const updated = await repo.update(id, parsed.data, scope.userId, scope.orgId || null, scope.role)
        return NextResponse.json({ product: updated })
    } catch (error) {
        console.error('[products/:id] PATCH error:', error)
        if (error instanceof Error && error.message === 'Unauthorized') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
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
        const { id } = await params
        const repo = new ProductsRepository(supabase)
        await repo.delete(id, scope.userId, scope.orgId || null, scope.role)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[products/:id] DELETE error:', error)
        if (error instanceof Error) {
            if (error.message === 'Unauthorized') {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            const code = (error as any).code
            if (code === 'PRODUCT_IN_USE') {
                return NextResponse.json({ error: 'Product is in use and cannot be deleted' }, { status: 409 })
            }
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
