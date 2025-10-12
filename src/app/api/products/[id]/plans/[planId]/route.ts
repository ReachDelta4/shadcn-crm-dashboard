import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { ProductPaymentPlansRepository } from '@/server/repositories/product-payment-plans'

const planUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    num_installments: z.number().int().min(1).optional(),
    interval_type: z.enum(['weekly','monthly','quarterly','semiannual','annual','custom_days']).optional(),
    interval_days: z.number().int().min(1).optional(),
    down_payment_minor: z.number().int().min(0).optional(),
    active: z.boolean().optional(),
})

async function getServerClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
    )
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string, planId: string }> }) {
    try {
        const supabase = await getServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { id: productId, planId } = await params
        const body = await request.json()
        const validated = planUpdateSchema.parse(body)
        const repo = new ProductPaymentPlansRepository(supabase as any)
        const existing = await repo.getById(planId)
        if (!existing || (existing as any).product_id !== productId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        const updated = await repo.update(planId, validated)
        return NextResponse.json({ plan: updated })
    } catch (error) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string, planId: string }> }) {
    try {
        const supabase = await getServerClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { id: productId, planId } = await params
        const repo = new ProductPaymentPlansRepository(supabase as any)
        const existing = await repo.getById(planId)
        if (!existing || (existing as any).product_id !== productId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        await repo.delete(planId)
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}







