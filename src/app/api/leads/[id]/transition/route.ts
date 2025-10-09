import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { NotificationService } from '@/server/services/notifications/notification-service'
import { flags } from '@/server/config/flags'
import { isTransitionAllowed, validateStatus } from '@/server/services/lifecycle/transition-matrix'
import { withIdempotency } from '@/server/utils/idempotency'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// No appointment/invoice payloads in lifecycle v2

// Removed invoice payload schema

const transitionSchema = z.object({
    target_status: z.enum(['new','contacted','qualified','disqualified','converted']).transform(s => s as any),
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

		const cookieStore = await cookies()
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{ cookies: { getAll() { return cookieStore.getAll() }, setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } } }
		)
		const leadsRepo = new LeadsRepository(supabase as any)
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

		const transitionsRepo = new LeadStatusTransitionsRepository(supabase as any)

    // Log + update locally (idempotent)
    await withIdempotency(parsed.idempotency_key, async () => {
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
      await (new LeadsRepository(supabase as any)).update(leadId, { status: parsed.target_status as any }, scope.userId)
    })

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
