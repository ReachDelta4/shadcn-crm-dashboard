import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { InvoicesRepository } from '@/server/repositories/invoices'

const invoiceUpdateSchema = z.object({
	customer_name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	amount: z.coerce.number().min(0).optional(),
	status: z.enum(['draft','pending','paid','overdue','cancelled']).optional(),
	date: z.string().optional(),
	due_date: z.string().optional(),
	items: z.coerce.number().min(0).optional(),
	payment_method: z.string().optional(),
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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await getServerClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const { id } = await params
	const repo = new InvoicesRepository(supabase)
	const invoice = await repo.getById(id, user.id)
	if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json(invoice)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id } = await params
		const body = await request.json()
		const validated = invoiceUpdateSchema.parse(body)
		const repo = new InvoicesRepository(supabase)
		const invoice = await repo.update(id, validated, user.id)
		return NextResponse.json(invoice)
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const supabase = await getServerClient()
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const { id } = await params
	const repo = new InvoicesRepository(supabase)
	await repo.delete(id, user.id)
	return NextResponse.json({ success: true })
}
