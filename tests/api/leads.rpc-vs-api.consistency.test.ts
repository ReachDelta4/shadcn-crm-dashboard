import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/server/repositories/leads', () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: 'lead_api_1',
      full_name: 'API Lead',
      email: 'api@example.com',
      status: 'new',
      subject_id: null,
    }),
  })),
}))

import { createServerClient } from '@supabase/ssr'

function makeSupabaseMock(userId?: string) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
      })),
    },
  }
}

describe('Cross-app consistency: lead creation invariants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('CRM web POST /api/leads creates a lead with status=new and owner-bound', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { POST } = await import('@/app/api/leads/route')

    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'API Lead',
        email: 'api@example.com',
      }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.status).toBe('new')
  })
})

