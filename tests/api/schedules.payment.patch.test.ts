import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/repositories/invoice-schedules', () => ({
  InvoicePaymentSchedulesRepository: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({ id: 'ps1', status: 'pending', due_at_utc: new Date().toISOString() }),
  })),
}))

function makeSupabaseMock(userId?: string) {
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from: vi.fn((table: string) => {
      if (table === 'invoice_payment_schedules') {
        return { select: () => ({ eq: () => ({ eq: () => ({ single: () => ({ data: { id: 'ps1' }, error: null }) }) }) }) }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    }),
    rpc: vi.fn((fn: string) => {
      if (fn === 'mark_schedule_paid_cascade') return { single: () => ({ data: { invoice_paid: true }, error: null }) }
      return { single: () => ({ data: null, error: null }) }
    }),
  }
  return client as any
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('PATCH /api/schedules/payment/[id]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))
    const { PATCH } = await import('@/app/api/schedules/payment/[id]/route')
    const res = await PATCH(new Request('http://localhost/api/schedules/payment/ps1', { method: 'PATCH' }) as any, { params: Promise.resolve({ id: 'ps1' }) } as any)
    expect(res.status).toBe(401)
  })

  it('marks schedule paid and cascades invoice when last', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('user_1'))
    const { PATCH } = await import('@/app/api/schedules/payment/[id]/route')
    const res = await PATCH(new Request('http://localhost/api/schedules/payment/ps1', { method: 'PATCH' }) as any, { params: Promise.resolve({ id: 'ps1' }) } as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.invoice_paid).toBe(true)
  })
})


