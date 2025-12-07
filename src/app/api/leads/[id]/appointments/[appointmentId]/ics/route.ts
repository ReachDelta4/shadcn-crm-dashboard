import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { generateICS, generateICSDownloadFilename } from '@/server/utils/ics-generator'

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
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId, appointmentId } = await params

		const supabase = await getServerClient()
		const leadsRepo = new LeadsRepository(supabase as any)
		const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		const appointmentsRepo = new LeadAppointmentsRepository(supabase as any)
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
		console.error('[ics] Error:', { error, context: 'lead_appointment_ics' })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
