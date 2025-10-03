import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { InvoicesRepository } from '@/server/repositories/invoices'
import { InvoiceLinesRepository } from '@/server/repositories/invoice-lines'
import { ProductsRepository } from '@/server/repositories/products'
import { ProductPaymentPlansRepository } from '@/server/repositories/product-payment-plans'
import { calculateInvoice, generatePaymentSchedule, generateRecurringSchedule, type LineItemInput } from '@/server/services/pricing-engine'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { NotificationService } from '@/server/services/notifications/notification-service'
import { flags } from '@/server/config/flags'
import { isTransitionAllowed, validateStatus } from '@/server/services/lifecycle/transition-matrix'

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

		// Demo appointment requires appointment payload
		let appointmentId: string | undefined
		if (parsed.target_status === 'demo_appointment') {
			if (!parsed.appointment) return NextResponse.json({ error: 'Appointment required' }, { status: 400 })
			const apptRepo = new LeadAppointmentsRepository()
			// Server-side overlap check to prevent race conditions
			const existing = await apptRepo.findByLeadId(leadId)
			const sNew = new Date(parsed.appointment.start_at_utc).getTime()
			const eNew = new Date(parsed.appointment.end_at_utc).getTime()
			const overlaps = (existing || []).some((a: any) => a.status === 'scheduled' && !(eNew <= new Date(a.start_at_utc).getTime() || sNew >= new Date(a.end_at_utc).getTime()))
			if (overlaps) {
				return NextResponse.json({ error: 'Overlapping appointment exists' }, { status: 409 })
			}
			const created = await apptRepo.create({
				lead_id: leadId,
				subject_id: (lead as any).subject_id || null,
				provider: parsed.appointment.provider,
				start_at_utc: parsed.appointment.start_at_utc,
				end_at_utc: parsed.appointment.end_at_utc,
				timezone: parsed.appointment.timezone,
				notes: parsed.appointment.notes || null,
			})
			appointmentId = created.id
			
			// Schedule reminders
			const notifService = new NotificationService()
			await notifService.scheduleAppointmentReminders(created.id, scope.userId, parsed.appointment.start_at_utc)
		}

		// Invoice sent requires invoice payload
		if ((parsed as any).target_status === 'invoice_sent') {
			if (!parsed.invoice) return NextResponse.json({ error: 'Invoice payload required' }, { status: 400 })
			const productsRepo = new ProductsRepository()
			const invoiceRepo = new InvoicesRepository()
			const linesRepo = new InvoiceLinesRepository()
			const plansRepo = new ProductPaymentPlansRepository()
			const productIds = parsed.invoice.line_items.map(li => li.product_id)
			const products = await Promise.all(productIds.map(id => productsRepo.getById(id, scope.orgId || null, scope.userId, scope.role)))
			const validProducts = products.filter(p => p !== null)
			const calculation = calculateInvoice(validProducts as any, parsed.invoice.line_items as LineItemInput[])
			const createdInvoice = await invoiceRepo.create({
				customer_name: parsed.invoice.customer_name || (lead as any).full_name,
				email: parsed.invoice.email || (lead as any).email,
				amount: calculation.total_minor / 100,
				status: 'pending',
				date: parsed.invoice.date || new Date().toISOString(),
				due_date: parsed.invoice.due_date || null,
				items: parsed.invoice.line_items.length,
				lead_id: leadId,
				subject_id: (lead as any).subject_id || null,
			}, scope.userId)
			const invoiceId = (createdInvoice as any).id
			const lineInserts = calculation.lines.map(line => ({
				invoice_id: invoiceId,
				product_id: line.product_id,
				description: validProducts.find(p => (p as any).id === line.product_id)?.name || 'Product',
				quantity: line.quantity,
				unit_price_minor: line.unit_price_minor,
				subtotal_minor: line.subtotal_minor,
				discount_minor: line.discount_minor,
				tax_minor: line.tax_minor,
				total_minor: line.total_minor,
				cogs_minor: line.cogs_minor,
				margin_minor: line.margin_minor,
				payment_plan_id: line.payment_plan_id,
			}))
			await linesRepo.bulkCreate(lineInserts)
		}

		// Log transition
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

		// Update lead status
		await (new LeadsRepository()).update(leadId, { status: parsed.target_status as any }, scope.userId)

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
