import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeClient(userId?: string) {
  const selects: Record<string, any> = {
    invoice_owner: { data: { id: 'inv1', status: 'pending' }, error: null },
    schedules: { data: [{ id: 's1', status: 'pending' }, { id: 's2', status: 'overdue' }], error: null },
    invoice_latest: { data: { id: 'inv1', status: 'paid', paid_at: new Date().toISOString() }, error: null },
  }
  const from = (table: string) => {
    if (table === 'invoices') {
      const chain: any = {
        select: () => ({ eq: () => ({ eq: () => ({ single: () => selects.invoice_owner }) }) }),
      }
      // later call changes to latest
      let first = true
      chain.select = () => ({
        eq: () => ({
          eq: () => ({
            single: () => {
              if (first) { first = false; return selects.invoice_owner }
              return selects.invoice_latest
            },
          }),
        }),
      })
      return chain
    }
    if (table === 'invoice_payment_schedules') {
      return {
        select: () => ({ eq: () => ({ neq: () => selects.schedules }) }),
      } as any
    }
    return { select: vi.fn() } as any
  }
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from,
    rpc: vi.fn(async () => ({ data: { invoice_paid: true }, error: null })),
  } as any
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('POST /api/invoices/[id]/pay', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeClient(undefined))
    const { POST } = await import('@/app/api/invoices/[id]/pay/route')
    const res = await POST(new Request('http://local') as any, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000000' }) })
    expect(res.status).toBe(401)
  })

  it('pays pending schedules and returns updated invoice status', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeClient('user_1'))
    const { POST } = await import('@/app/api/invoices/[id]/pay/route')
    const res = await POST(new Request('http://local', { method: 'POST' }) as any, { params: Promise.resolve({ id: '00000000-0000-0000-0000-000000000001' }) })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.paid_schedules).toBeGreaterThanOrEqual(1)
    expect(json.invoice_status).toBe('paid')
  })
})

