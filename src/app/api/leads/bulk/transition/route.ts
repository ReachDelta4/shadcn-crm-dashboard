import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { NotificationService } from '@/server/services/notifications/notification-service'

const bulkTransitionSchema = z.object({
	lead_ids: z.array(z.string().uuid()).min(1).max(1000), // Max 1000 for safety
	target_status: z.enum(['new','contacted','qualified','demo_appointment','proposal_negotiation','invoice_sent','won','lost']),
	override: z.boolean().optional(),
	override_reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
	try {
		const scope = await getUserAndScope()
		const body = await request.json()
		const parsed = bulkTransitionSchema.parse(body)

		const leadsRepo = new LeadsRepository()
		const transitionsRepo = new LeadStatusTransitionsRepository()
		const notifService = new NotificationService()

		// Fetch all leads with scope check
		const leads = await Promise.all(
			parsed.lead_ids.map(id => leadsRepo.getById(id, scope.userId, scope.allowedOwnerIds))
		)

		const results: Array<{ lead_id: string; success: boolean; error?: string }> = []

		// Process each lead individually
		for (let i = 0; i < leads.length; i++) {
			const lead = leads[i]
			const leadId = parsed.lead_ids[i]

			if (!lead) {
				results.push({ lead_id: leadId, success: false, error: 'Not found or access denied' })
				continue
			}

			try {
				// Skip if already in target status (self-transition)
				if ((lead as any).status === parsed.target_status) {
					results.push({ lead_id: leadId, success: true, error: 'Already in target status (skipped)' })
					continue
				}

				// Log transition
				await transitionsRepo.create({
					lead_id: leadId,
					subject_id: (lead as any).subject_id || null,
					actor_id: scope.userId,
					event_type: 'status_change',
					status_from: (lead as any).status || null,
					status_to: parsed.target_status,
					override_flag: !!parsed.override,
					override_reason: parsed.override_reason || null,
					idempotency_key: null,
					metadata: { bulk_operation: true },
				})

				// Update lead
				await leadsRepo.update(leadId, { status: parsed.target_status as any }, scope.userId)

				results.push({ lead_id: leadId, success: true })

				// Send notification (best-effort, throttled)
				notifService.send({
					type: 'status_change',
					user_id: scope.userId,
					title: 'Bulk Status Update',
					message: `${leads.filter(l => l).length} leads moved to ${parsed.target_status}`,
					entity_type: 'bulk_operation',
				}).catch(() => {})

			} catch (error: any) {
				results.push({ lead_id: leadId, success: false, error: error.message || 'Unknown error' })
			}
		}

		const successCount = results.filter(r => r.success).length
		const failureCount = results.filter(r => !r.success).length

		return NextResponse.json({
			success: failureCount === 0,
			total: results.length,
			successful: successCount,
			failed: failureCount,
			results,
		})
	} catch (error) {
		console.error('[bulk transition] error:', error)
		if (error instanceof z.ZodError) {
			return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		}
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
