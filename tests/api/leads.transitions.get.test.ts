import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/server/repositories/lead-status-transitions', () => ({
  LeadStatusTransitionsRepository: vi.fn().mockImplementation(() => ({
    findByLeadId: vi.fn().mockResolvedValue([]),
  })),
}))

vi.mock('@/server/services/logging/lead-logger', () => ({
  logLeadTransition: vi.fn(),
  logLeadError: vi.fn(),
}))

import { createServerClient } from '@supabase/ssr'

describe('GET /api/leads/[id]/transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when user is not authenticated', async () => {
    ;(createServerClient as any).mockResolvedValueOnce({
      auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    })
    const { GET } = await import('@/app/api/leads/[id]/transitions/route')
    const res = await GET(new Request('http://localhost/api/leads/lead_1/transitions') as any, {
      params: Promise.resolve({ id: 'lead_1' }),
    } as any)
    expect(res.status).toBe(401)
  })

  it('returns 500 with code on repository error', async () => {
    ;(createServerClient as any).mockResolvedValueOnce({
      auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } } })) },
    })
    const { LeadStatusTransitionsRepository } = await import('@/server/repositories/lead-status-transitions')
    ;(LeadStatusTransitionsRepository as any).mockImplementation(() => ({
      findByLeadId: vi.fn().mockRejectedValue(new Error('boom')),
    }))

    const { GET } = await import('@/app/api/leads/[id]/transitions/route')
    const res = await GET(new Request('http://localhost/api/leads/lead_1/transitions') as any, {
      params: Promise.resolve({ id: 'lead_1' }),
    } as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.code).toBe('internal_error')
  })
})

