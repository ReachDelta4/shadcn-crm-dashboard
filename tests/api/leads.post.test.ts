import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/server/repositories/leads', () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn(),
    list: vi.fn(),
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

describe('POST /api/leads', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))

    const { POST } = await import('@/app/api/leads/route')
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Jane Doe', email: 'jane@example.com' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('creates a lead successfully when payload is valid', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { LeadsRepository } = await import('@/server/repositories/leads')
    const createMock = vi.fn().mockResolvedValue({
      id: 'lead_1',
      full_name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'new',
    })
    ;(LeadsRepository as any).mockImplementation(() => ({
      create: createMock,
    }))

    const { POST } = await import('@/app/api/leads/route')
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'new',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('lead_1')
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'new',
      }),
      'u1',
    )
  })

  it('maps leads_status_check violations to 400 instead of 500', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))

    const { LeadsRepository } = await import('@/server/repositories/leads')
    ;(LeadsRepository as any).mockImplementation(() => ({
      create: vi
        .fn()
        .mockRejectedValue(
          new Error(
            'Failed to create lead: new row for relation "leads" violates check constraint "leads_status_check"',
          ),
        ),
    }))

    const { POST } = await import('@/app/api/leads/route')
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        status: 'disqualified',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/lead status/i)
  })

  it('rejects invalid source values', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))

    const { POST } = await import('@/app/api/leads/route')
    const req = new Request('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        source: 'some_random_source',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/validation/i)
  })
})
