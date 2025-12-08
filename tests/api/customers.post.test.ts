import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/server/repositories/customers', () => ({
  CustomersRepository: vi.fn().mockImplementation(() => ({
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
        error: null,
      })),
    },
  }
}

describe('POST /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))

    const { POST } = await import('@/app/api/customers/route')
    const req = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Acme', email: 'a@b.com' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('creates a customer successfully when payload is valid', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { CustomersRepository } = await import('@/server/repositories/customers')
    const createMock = vi.fn().mockResolvedValue({
      id: 'cust_1',
      full_name: 'Acme',
      email: 'a@b.com',
      status: 'active',
    })
    ;(CustomersRepository as any).mockImplementation(() => ({
      create: createMock,
    }))

    const { POST } = await import('@/app/api/customers/route')
    const req = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Acme',
        email: 'a@b.com',
        status: 'active',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('cust_1')
  })

  it('maps customers_status_check violations to 400 instead of 500', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))

    const { CustomersRepository } = await import('@/server/repositories/customers')
    ;(CustomersRepository as any).mockImplementation(() => ({
      create: vi
        .fn()
        .mockRejectedValue(
          new Error(
            'Failed to create customer: new row for relation "customers" violates check constraint "customers_status_check"',
          ),
        ),
    }))

    const { POST } = await import('@/app/api/customers/route')
    const req = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Acme',
        email: 'a@b.com',
        status: 'churned',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/customer status/i)
  })
})

