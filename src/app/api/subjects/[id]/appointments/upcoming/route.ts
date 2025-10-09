import { NextRequest, NextResponse } from 'next/server'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
                    setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
                },
            }
        )
		const { id: subjectId } = await params
        const repo = new LeadAppointmentsRepository(supabase as any)
		const nowIso = new Date().toISOString()
		const appointments = await repo.findUpcomingBySubjectId(subjectId, nowIso, 5, scope.userId)
		return NextResponse.json({ appointments })
	} catch (error) {
		console.error('[subjects/appointments/upcoming] Error:', error)
		if ((error as any).message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
