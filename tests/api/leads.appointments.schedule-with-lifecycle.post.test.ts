import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/auth/getUserAndScope', () => ({
  getUserAndScope: vi.fn().mockResolvedValue({
    userId: 'u1',
    role: 'rep',
    teamId: null,
    orgId: null,
    allowedOwnerIds: ['u1'],
  }),
}))

vi.mock('@/server/repositories/leads', () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({
      id: 'lead_1',
      full_name: 'Jane Doe',
      status: 'new',
      subject_id: 'sub_1',
    }),
    update: vi.fn().mockResolvedValue(true),
  })),
}))

vi.mock('@/server/repositories/lead-appointments', () => ({
  LeadAppointmentsRepository: vi.fn().mockImplementation(() => ({
    findByLeadId: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(async (payload) => ({
      id: 'appt_1',
      ...payload,
    })),
  })),
}))

vi.mock('@/server/repositories/lead-status-transitions', () => ({
  LeadStatusTransitionsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({ id: 't1' }),
  })),
}))

vi.mock('@/server/services/notifications/notification-service', () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@/server/utils/idempotency', () => ({
  withIdempotency: async (_k: any, fn: any) => await fn(),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockReturnValue({
    from: vi.fn(),
  }),
}))

import { POST } from '@/app/api/leads/[id]/appointments/schedule-with-lifecycle/route'

describe('POST /api/leads/[id]/appointments/schedule-with-lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates appointment and advances status when allowed', async () => {
    const now = new Date()
    const start = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    const end = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()

    const req = new Request('http://localhost/api/leads/lead_1/appointments/schedule-with-lifecycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_at_utc: start,
        end_at_utc: end,
        timezone: 'UTC',
      }),
    })

    const res = await POST(req as any, { params: Promise.resolve({ id: 'lead_1' }) } as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.appointment).toBeDefined()
    expect(json.status).toBe('qualified')
  })

  it('rejects invalid time range', async () => {
    const now = new Date()
    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
    const end = new Date(now.getTime() + 60 * 60 * 1000).toISOString()

    const req = new Request('http://localhost/api/leads/lead_1/appointments/schedule-with-lifecycle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_at_utc: start,
        end_at_utc: end,
        timezone: 'UTC',
      }),
    })

    const res = await POST(req as any, { params: Promise.resolve({ id: 'lead_1' }) } as any)
    expect(res.status).toBe(400)
  })
})

