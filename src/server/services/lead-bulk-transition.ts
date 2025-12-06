import { z } from 'zod'
import type { UserScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { NotificationService } from '@/server/services/notifications/notification-service'
import { isTransitionAllowed } from '@/server/services/lifecycle/transition-matrix'
import { flags } from '@/server/config/flags'

export const bulkTransitionSchema = z.object({
	lead_ids: z.array(z.string().uuid()).min(1).max(1000),
	target_status: z.enum(['new','contacted','qualified','disqualified','converted']),
	override: z.boolean().optional(),
	override_reason: z.string().optional(),
})

export async function runBulkTransition(params: {
    scope: UserScope;
    parsed: z.infer<typeof bulkTransitionSchema>;
    supabase: any;
    leadsRepo?: LeadsRepository;
    transitionsRepo?: LeadStatusTransitionsRepository;
    notifService?: NotificationService;
}) {
    const { scope, parsed, supabase } = params
    const leadsRepo = params.leadsRepo ?? new LeadsRepository(supabase as any)
    const transitionsRepo = params.transitionsRepo ?? new LeadStatusTransitionsRepository(supabase as any)
    const notifService = params.notifService ?? new NotificationService(supabase)

    const leads = await Promise.all(
        parsed.lead_ids.map(id => leadsRepo.getById(id, scope.userId, scope.allowedOwnerIds))
    )

    const results: Array<{ lead_id: string; success: boolean; error?: string }> = []

    for (let i = 0; i < leads.length; i++) {
        const lead = leads[i]
        const leadId = parsed.lead_ids[i]

        if (!lead) {
            results.push({ lead_id: leadId, success: false, error: 'Not found or access denied' })
            continue
        }

        try {
            if ((lead as any).status === parsed.target_status) {
                results.push({ lead_id: leadId, success: true, error: 'Already in target status (skipped)' })
                continue
            }

            const allowed = isTransitionAllowed(((lead as any).status as any), parsed.target_status as any)
            if (!allowed && !parsed.override && flags.lifecycleEnforcement === 'enforce') {
                results.push({ lead_id: leadId, success: false, error: 'Transition not allowed by lifecycle rules' })
                continue
            }

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

            await leadsRepo.update(leadId, { status: parsed.target_status as any }, scope.userId)

            results.push({ lead_id: leadId, success: true })

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

    return {
        success: failureCount === 0,
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results,
    }
}
