import { NextRequest, NextResponse } from 'next/server'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		await getUserAndScope()
		const { id: subjectId } = await params
		const repo = new LeadAppointmentsRepository()
		const nowIso = new Date().toISOString()
		const appointments = await repo.findUpcomingBySubjectId(subjectId, nowIso, 5)
		return NextResponse.json({ appointments })
	} catch (error) {
		console.error('[subjects/appointments/upcoming] Error:', error)
		if ((error as any).message === 'Unauthorized') {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
