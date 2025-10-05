import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { NotificationService } from '@/server/services/notifications/notification-service'
import { flags } from '@/server/config/flags'
import { isTransitionAllowed, validateStatus } from '@/server/services/lifecycle/transition-matrix'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const appointmentSchema = z.object({
	provider: z.enum(['google','outlook','ics','none']).default('none'),
	start_at_utc: z.string(),
	end_at_utc: z.string(),
	timezone: z.string(),
	notes: z.record(z.any()).optional(),
})

const lineItemSchema = z.object({
	product_id: z.string().uuid(),
	quantity: z.number().int().min(1),
	unit_price_override_minor: z.number().int().min(0).optional(),
	discount_type: z.enum(['percent', 'amount']).optional(),
	discount_value: z.number().int().min(0).optional(),
	payment_plan_id: z.string().uuid().optional(),
})

const transitionSchema = z.object({
	target_status: z.enum(['new','contacted','qualified','demo_appointment','proposal_negotiation','won','lost','invoice_sent']).transform(s => s as any),
	appointment: appointmentSchema.optional(),
	invoice: z.object({
		customer_name: z.string().optional(),
		email: z.string().email().optional(),
		line_items: z.array(lineItemSchema).min(1),
		date: z.string().optional(),
		due_date: z.string().optional(),
	}).optional(),
	idempotency_key: z.string().optional(),
	metadata: z.record(z.any()).optional(),
	override: z.boolean().optional(),
	override_reason: z.string().optional(),
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const scope = await getUserAndScope()
		const { id: leadId } = await params
		const body = await request.json()
		const parsed = transitionSchema.parse(body)

		const leadsRepo = new LeadsRepository()
		const lead = await leadsRepo.getById(leadId, scope.userId)
		if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

		// Validate target status
		if (!validateStatus(parsed.target_status)) {
			return NextResponse.json({ error: 'Invalid target status' }, { status: 400 })
		}

		// Enforce lifecycle rules unless override
		const currentStatus = (lead as any).status as any
		const allowed = isTransitionAllowed(currentStatus, parsed.target_status as any)
		if (!allowed && !parsed.override) {
			if (flags.lifecycleEnforcement === 'enforce') {
				return NextResponse.json({ error: 'Transition not allowed by lifecycle rules' }, { status: 409 })
			} else if (flags.lifecycleEnforcement === 'log_only') {
				console.warn(`[lifecycle] Disallowed transition (log_only): ${leadId} ${currentStatus} -> ${parsed.target_status}`)
			}
		}

		const transitionsRepo = new LeadStatusTransitionsRepository()

		// If demo appointment, delegate to transactional RPC
		if (parsed.target_status === 'demo_appointment') {
			if (!parsed.appointment) return NextResponse.json({ error: 'Appointment required' }, { status: 400 })
			const supabase = await getServerClient()
			const result = await (supabase as any).rpc('fn_transition_with_appointment', {
				p_lead_id: leadId,
				p_target_status: 'demo_appointment',
				p_payload: parsed.appointment,
				p_idempotency_key: parsed.idempotency_key || null
			})
			if (result.error) {
				return NextResponse.json({ error: result.error.message || 'Transition failed' }, { status: 409 })
			}
			// Send reminders best-effort
			try {
				const createdId = result.data?.appointment_id
				if (createdId) {
					const notifService = new NotificationService()
					await notifService.scheduleAppointmentReminders(createdId, scope.userId, parsed.appointment.start_at_utc)
				}
			} catch {}
			return NextResponse.json({ success: true })
		}

		// Invoice-related transitions: delegate to transactional RPC
		if ((parsed as any).target_status === 'invoice_sent' || (parsed as any).target_status === 'won') {
			if (!parsed.invoice || !Array.isArray(parsed.invoice.line_items) || parsed.invoice.line_items.length === 0) {
				return NextResponse.json({ error: 'Invoice payload required' }, { status: 400 })
			}
			const supabase = await getServerClient()
			const result = await (supabase as any).rpc('fn_transition_with_invoice', {
				p_lead_id: leadId,
				p_target_status: parsed.target_status,
				p_payload: parsed.invoice,
				p_idempotency_key: parsed.idempotency_key || null
			})
			if (result.error) {
				return NextResponse.json({ error: result.error.message || 'Transition failed' }, { status: 409 })
			}
		}

		// For simple transitions without appointment/invoice, log + update locally
		if (parsed.target_status !== 'demo_appointment' && parsed.target_status !== 'invoice_sent' && parsed.target_status !== 'won') {
			await transitionsRepo.create({
				lead_id: leadId,
				subject_id: (lead as any).subject_id || null,
				actor_id: scope.userId,
				event_type: 'status_change',
				status_from: (lead as any).status || null,
				status_to: parsed.target_status as any,
				override_flag: !!parsed.override,
				override_reason: parsed.override_reason || null,
				idempotency_key: parsed.idempotency_key || null,
				metadata: parsed.metadata || null,
			})
			await (new LeadsRepository()).update(leadId, { status: parsed.target_status as any }, scope.userId)
		}

		// Send notification (best-effort)
		const notifService = new NotificationService()
		await notifService.send({
			type: 'status_change',
			user_id: scope.userId,
			title: 'Lead Status Updated',
			message: `Lead "${(lead as any).full_name}" moved to ${parsed.target_status}`,
			entity_type: 'lead',
			entity_id: leadId,
		}).catch(() => {})

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('[lead transition] error:', error)
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
