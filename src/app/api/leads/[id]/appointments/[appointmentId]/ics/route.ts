import { NextRequest, NextResponse } from 'next/server'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { generateICS, generateICSDownloadFilename } from '@/server/utils/ics-generator'

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId, appointmentId } = await params
		
		const leadsRepo = new LeadsRepository()
		const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		const appointmentsRepo = new LeadAppointmentsRepository()
		const appointments = await appointmentsRepo.findByLeadId(leadId)
		const appointment = appointments.find(a => a.id === appointmentId)
		if (!appointment) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

		const icsContent = generateICS({
			uid: appointment.id,
			title: `Meeting with ${lead.full_name || 'Lead'} (${lead.company || 'Company'})`,
			description: `Demo/Appointment scheduled via Salesy CRM`,
			location: appointment.meeting_link || undefined,
			startUtc: appointment.start_at_utc,
			endUtc: appointment.end_at_utc,
			timezone: appointment.timezone,
		})

		const filename = generateICSDownloadFilename(
			`Meeting_${lead.full_name || 'Lead'}`,
			appointment.start_at_utc
		)

		return new NextResponse(icsContent, {
			status: 200,
			headers: {
				'Content-Type': 'text/calendar; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}"`,
			},
		})
	} catch (error) {
		console.error('[ics] Error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
