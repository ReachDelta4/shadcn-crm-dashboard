import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/auth/getUserAndScope', () => ({
  getUserAndScope: vi.fn().mockResolvedValue({
    userId: 'u1',
    role: 'member',
    teamId: null,
    orgId: 'org-1',
    allowedOwnerIds: ['u1'],
  }),
}))

// Flags control enforcement path
vi.mock('@/server/config/flags', () => ({ flags: { lifecycleEnforcement: 'enforce', notificationsThrottleMs: 60_000 } }))

// Idempotency wrapper executes the callback directly
vi.mock('@/server/utils/idempotency', () => ({ withIdempotency: async (_k: any, fn: any) => await fn() }))

vi.mock('@/server/repositories/leads', () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({ id: 'lead_1', full_name: 'Jane', status: 'new', subject_id: null }),
    update: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('@/server/repositories/lead-status-transitions', () => ({
  LeadStatusTransitionsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: 't1' }),
  })),
}))

// Notification service is best-effort; stub send to resolve
vi.mock('@/server/services/notifications/notification-service', () => ({
  NotificationService: vi.fn().mockImplementation(() => ({ send: vi.fn().mockResolvedValue(undefined) })),
}))

function makeSupabaseMock(userId?: string) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
  }
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))

import { createServerClient } from '@supabase/ssr'

describe('POST /api/leads/[id]/transition', () => {
  beforeEach(() => vi.clearAllMocks())

  it('allows valid transition new -> contacted', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { POST } = await import('@/app/api/leads/[id]/transition/route')
    const res = await POST(new Request('http://localhost/api/leads/lead_1/transition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_status: 'contacted' }),
    }) as any, { params: Promise.resolve({ id: 'lead_1' }) } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it('rejects transition to same status when enforcement is on', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    // Return current status 'new' and try to transition to 'new'
    const { LeadsRepository } = await import('@/server/repositories/leads')
    ;(LeadsRepository as any).mockImplementation(() => ({ getById: vi.fn().mockResolvedValue({ id: 'lead_1', full_name: 'Jane', status: 'new' }) }))
    const { POST } = await import('@/app/api/leads/[id]/transition/route')
    const res = await POST(new Request('http://localhost/api/leads/lead_1/transition', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target_status: 'new' }),
    }) as any, { params: Promise.resolve({ id: 'lead_1' }) } as any)
    expect(res.status).toBe(409)
    const json = await res.json()
    expect(json.code).toBe('lead_transition_not_allowed')
  })
})


