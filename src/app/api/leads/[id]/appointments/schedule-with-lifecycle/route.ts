import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadAppointmentsRepository } from '@/server/repositories/lead-appointments'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'
import { NotificationService } from '@/server/services/notifications/notification-service'
import { flags } from '@/server/config/flags'
import { isTransitionAllowed, validateStatus } from '@/server/services/lifecycle/transition-matrix'
import { APPOINTMENT_TARGET_STATUS, shouldAdvanceToQualified } from '@/features/leads/status-utils'
import { withIdempotency } from '@/server/utils/idempotency'

const scheduleSchema = z.object({
  start_at_utc: z.string(),
  end_at_utc: z.string(),
  timezone: z.string().min(1),
  provider: z.enum(['google', 'outlook', 'ics', 'none']).optional(),
  meeting_link: z.string().optional(),
  notes: z.any().optional(),
  idempotency_key: z.string().optional(),
})

async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    },
  )
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const scope = await getUserAndScope()
    const { id: leadId } = await params
    const leadsRepo = new LeadsRepository(supabase as any)
    const lead = await leadsRepo.getById(leadId, scope.userId, scope.allowedOwnerIds)
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

    const body = await request.json()
    const parsed = scheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.errors }, { status: 400 })
    }

    const { start_at_utc, end_at_utc, timezone, provider, meeting_link, notes, idempotency_key } =
      parsed.data

    // Validate time window
    const sNew = new Date(start_at_utc).getTime()
    const eNew = new Date(end_at_utc).getTime()
    if (!(Number.isFinite(sNew) && Number.isFinite(eNew)) || eNew <= sNew) {
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
    }

    const apptRepo = new LeadAppointmentsRepository(supabase as any)

    // Overlap guard: reject if another scheduled appointment overlaps for this lead
    const existing = await apptRepo.findByLeadId(leadId)
    const overlaps = (existing || []).some((a: any) => {
      if (a.status !== 'scheduled') return false
      const sExisting = new Date(a.start_at_utc).getTime()
      const eExisting = new Date(a.end_at_utc).getTime()
      return !(eNew <= sExisting || sNew >= eExisting)
    })
    if (overlaps) {
      return NextResponse.json({ error: 'Overlapping appointment exists' }, { status: 409 })
    }

    // Compute lifecycle target, if any
    const currentStatus = (lead as any).status as any
    let targetStatus: any = null
    if (shouldAdvanceToQualified(currentStatus)) {
      targetStatus = APPOINTMENT_TARGET_STATUS
    }

    if (targetStatus && !validateStatus(targetStatus)) {
      return NextResponse.json({ error: 'Invalid target status' }, { status: 400 })
    }

    // Enforce lifecycle rules prior to creating the appointment when strict
    if (targetStatus) {
      const allowed = isTransitionAllowed(currentStatus, targetStatus)
      if (!allowed && flags.lifecycleEnforcement === 'enforce') {
        return NextResponse.json(
          { error: 'Transition not allowed by lifecycle rules' },
          { status: 409 },
        )
      }
    }

    const created = await apptRepo.create({
      lead_id: leadId,
      subject_id: (lead as any).subject_id || null,
      start_at_utc,
      end_at_utc,
      timezone,
      provider: provider || 'none',
      meeting_link: meeting_link || null,
      notes: notes || null,
    })

    // Apply lifecycle transition best-effort when we have a valid target
    if (targetStatus && targetStatus !== currentStatus) {
      const transitionsRepo = new LeadStatusTransitionsRepository(supabase as any)
      const notifService = new NotificationService(supabase)

      await withIdempotency(idempotency_key, async () => {
        await transitionsRepo.create({
          lead_id: leadId,
          subject_id: (lead as any).subject_id || null,
          actor_id: scope.userId,
          event_type: 'status_change',
          status_from: (lead as any).status || null,
          status_to: targetStatus,
          override_flag: false,
          override_reason: null,
          idempotency_key: idempotency_key || null,
          metadata: { reason: 'appointment_scheduled' },
        })
        await leadsRepo.update(leadId, { status: targetStatus }, scope.userId, scope.allowedOwnerIds)

        await notifService
          .send({
            type: 'status_change',
            user_id: scope.userId,
            title: 'Lead Status Updated',
            message: `Lead "${(lead as any).full_name}" moved to ${targetStatus}`,
            entity_type: 'lead',
            entity_id: leadId,
          })
          .catch(() => {})
      })
    }

    return NextResponse.json({ appointment: created, status: targetStatus || currentStatus }, { status: 201 })
  } catch (error) {
    console.error('[appointments schedule-with-lifecycle] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

