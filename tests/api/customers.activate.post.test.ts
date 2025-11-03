import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeSupabaseMock(userId?: string) {
  const tables: Record<string, any> = {}
  const client: any = {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from: vi.fn((table: string) => {
      if (!tables[table]) tables[table] = {}
      if (table === 'customers') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: userId ? { id: 'c1', owner_id: userId, status: 'pending' } : null, error: userId ? null : new Error('err') }) }) }) }),
          update: () => ({ eq: () => ({ eq: () => ({}) }) }),
        }
      }
      if (table === 'invoices') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ data: [{ id: 'inv1' }], error: null }) }) }) }),
          update: () => ({ in: () => ({ eq: () => ({}) }) }),
        }
      }
      if (table === 'invoice_payment_schedules') {
        return { update: () => ({ in: () => ({ neq: () => ({}) }) }) }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    })
  }
  return client
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('POST /api/customers/[id]/activate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))
    const { POST } = await import('@/app/api/customers/[id]/activate/route')
    const res = await POST(new Request('http://localhost/api/customers/c1/activate', { method: 'POST' }) as any, { params: Promise.resolve({ id: 'c1' }) } as any)
    expect(res.status).toBe(401)
  })

  it('returns 404 on invalid UUID', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { POST } = await import('@/app/api/customers/[id]/activate/route')
    const res = await POST(new Request('http://localhost/api/customers/not-a-uuid/activate', { method: 'POST' }) as any, { params: Promise.resolve({ id: 'not-a-uuid' }) } as any)
    expect(res.status).toBe(404)
  })

  it('activates customer and marks pending invoices paid', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('00000000-0000-0000-0000-000000000000'))
    const { POST } = await import('@/app/api/customers/[id]/activate/route')
    const res = await POST(new Request('http://localhost/api/customers/00000000-0000-0000-0000-000000000000/activate', { method: 'POST' }) as any, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.invoices_marked_paid).toBeGreaterThanOrEqual(0)
  })
})


