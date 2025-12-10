import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { checkDuplicateContact } from '@/server/services/duplicate-contacts'

const schema = z.object({
	email: z.string().email().optional(),
	phone: z.string().optional(),
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

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const scope = await getUserAndScope()

		const { searchParams } = new URL(request.url)
		const parsed = schema.safeParse({
			email: searchParams.get('email') || undefined,
			phone: searchParams.get('phone') || undefined,
		})
		if (!parsed.success) {
			return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 })
		}

		if (!parsed.data.email && !parsed.data.phone) {
			return NextResponse.json({ error: 'No email or phone provided' }, { status: 400 })
		}

		const result = await checkDuplicateContact(supabase as any, {
			email: parsed.data.email,
			phone: parsed.data.phone,
			orgId: scope.orgId ?? undefined,
			ownerIds: scope.allowedOwnerIds,
		})

		return NextResponse.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		if (message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		console.error('[leads:check-duplicates] error', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

