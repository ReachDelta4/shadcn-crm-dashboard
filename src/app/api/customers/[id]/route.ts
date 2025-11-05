import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { CustomersRepository } from '@/server/repositories/customers'

const customerUpdateSchema = z.object({
	full_name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	company: z.string().optional(),
	location: z.string().optional(),
	status: z.enum(['active', 'inactive', 'pending', 'churned']).optional(),
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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user, supabase } = await getAuthenticatedUser(request)
		const { id } = await params
		const repo = new CustomersRepository(supabase)
		const customer = await repo.getById(id, user.id)
		
		if (!customer) {
			return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
		}
		
		return NextResponse.json(customer)
	} catch (error) {
		console.error('GET /api/customers/[id] error:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user, supabase } = await getAuthenticatedUser(request)
		const { id } = await params
		const body = await request.json()
		
		const validatedData = customerUpdateSchema.parse(body)
		
		const repo = new CustomersRepository(supabase)
		const customer = await repo.update(id, validatedData, user.id)
		
		return NextResponse.json(customer)
	} catch (error) {
		console.error('PATCH /api/customers/[id] error:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		if (error instanceof z.ZodError) {
			return NextResponse.json(
				{ error: 'Validation failed', details: error.errors },
				{ status: 400 }
			)
		}

		if (error instanceof Error && error.message.includes('not found')) {
			return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { user, supabase } = await getAuthenticatedUser(request)
		const { id } = await params
		const repo = new CustomersRepository(supabase)
		await repo.delete(id, user.id)
		
		return NextResponse.json({ success: true }, { status: 200 })
	} catch (error) {
		console.error('DELETE /api/customers/[id] error:', error)
		
		if (error instanceof Error && error.message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		if (error instanceof Error && error.message.includes('not found')) {
			return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
		}

		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
