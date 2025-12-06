import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { bulkTransitionSchema, runBulkTransition } from '@/server/services/lead-bulk-transition'

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

export async function POST(request: NextRequest) {
	try {
		const scope = await getUserAndScope()
		const body = await request.json()
		const parsed = bulkTransitionSchema.parse(body)

		const supabase = await getServerClient()
		const response = await runBulkTransition({ scope, parsed, supabase })
		return NextResponse.json(response)
	} catch (error) {
		console.error('[bulk transition] error:', error)
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
