import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'

const createSchema = z.object({
	start_at_utc: z.string(),
	end_at_utc: z.string(),
	timezone: z.string().min(1),
	provider: z.enum(['google','outlook','ics','none']).optional(),
	meeting_link: z.string().optional(),
	notes: z.any().optional(),
})

const updateSchema = z.object({
    status: z.enum(['scheduled','cancelled','completed']).optional(),
    start_at_utc: z.string().optional(),
    end_at_utc: z.string().optional(),
    timezone: z.string().optional(),
    meeting_link: z.string().optional(),
    notes: z.any().optional(),
    call_outcome: z.enum(['taken','missed']).optional(),
})

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId } = await params
		const leadsRepo = new LeadsRepository()
		const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		const repo = new LeadAppointmentsRepository()
		const appointments = await repo.findByLeadId(leadId)
		return NextResponse.json({ appointments })
	} catch (error) {
		console.error('[appointments] GET error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId } = await params
		const leadsRepo = new LeadsRepository()
		const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		const body = await request.json()
		const parsed = createSchema.safeParse(body)
		if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })

		const repo = new LeadAppointmentsRepository()
		// Overlap guard: check scheduled overlapping windows for this lead
		const existing = await repo.findByLeadId(leadId)
		const sNew = new Date(parsed.data.start_at_utc).getTime()
		const eNew = new Date(parsed.data.end_at_utc).getTime()
		if (!(Number.isFinite(sNew) && Number.isFinite(eNew)) || eNew <= sNew) {
			return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
		}
		const overlaps = (existing || []).some((a: any) => a.status === 'scheduled' && !(eNew <= new Date(a.start_at_utc).getTime() || sNew >= new Date(a.end_at_utc).getTime()))
		if (overlaps) {
			return NextResponse.json({ error: 'Overlapping appointment exists' }, { status: 409 })
		}
		const created = await repo.create({
			lead_id: leadId,
			subject_id: lead.subject_id || null,
			start_at_utc: parsed.data.start_at_utc,
			end_at_utc: parsed.data.end_at_utc,
			timezone: parsed.data.timezone,
			provider: parsed.data.provider || 'none',
			meeting_link: parsed.data.meeting_link || null,
			notes: parsed.data.notes || null,
		})
		return NextResponse.json({ appointment: created }, { status: 201 })
	} catch (error) {
		console.error('[appointments] POST error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId } = await params
		const leadsRepo = new LeadsRepository()
		const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		const body = await request.json()
		const parsed = updateSchema.safeParse(body)
		if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })

        const { appointment_id, ...updates } = body
		if (!appointment_id) return NextResponse.json({ error: 'appointment_id required' }, { status: 400 })

		const repo = new LeadAppointmentsRepository()
        const updated = await repo.update(appointment_id, updates)
		return NextResponse.json({ appointment: updated })
	} catch (error) {
		console.error('[appointments] PATCH error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId } = await params
		const leadsRepo = new LeadsRepository()
		const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		const body = await request.json().catch(() => ({}))
		const appointmentId = body?.appointment_id
		if (!appointmentId) return NextResponse.json({ error: 'appointment_id required' }, { status: 400 })

		const repo = new LeadAppointmentsRepository()
		await repo.delete(appointmentId)
		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('[appointments] DELETE error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
