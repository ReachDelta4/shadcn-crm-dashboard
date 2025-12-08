import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/server/repositories/orders', () => ({
  OrdersRepository: vi.fn().mockImplementation(() => ({
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

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Jane',
        email: 'jane@example.com',
        amount: 100,
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('creates an order successfully when payload is valid', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { OrdersRepository } = await import('@/server/repositories/orders')
    const createMock = vi.fn().mockResolvedValue({
      id: 'ord_1',
      customer_name: 'Jane',
      email: 'jane@example.com',
      amount: 100,
      status: 'pending',
    })
    ;(OrdersRepository as any).mockImplementation(() => ({
      create: createMock,
    }))

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Jane',
        email: 'jane@example.com',
        amount: 100,
        status: 'pending',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('ord_1')
  })

  it('maps orders_status_check violations to 400 instead of 500', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))

    const { OrdersRepository } = await import('@/server/repositories/orders')
    ;(OrdersRepository as any).mockImplementation(() => ({
      create: vi
        .fn()
        .mockRejectedValue(
          new Error(
            'Failed to create order: new row for relation "orders" violates check constraint "orders_status_check"',
          ),
        ),
    }))

    const { POST } = await import('@/app/api/orders/route')
    const req = new Request('http://localhost/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Jane',
        email: 'jane@example.com',
        amount: 100,
        status: 'completed',
      }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/order status/i)
  })
})

