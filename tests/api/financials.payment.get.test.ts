import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeSupabaseMock(userId?: string) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from: vi.fn((table: string) => {
      if (table === 'invoice_payment_schedules') {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({ data: [
                { id: 'ps1', invoice_id: 'inv1', invoice_line_id: 'l1', installment_num: 1, due_at_utc: new Date().toISOString(), amount_minor: 1000, status: 'pending' },
              ], error: null })
            })
          })
        }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    })
  }
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('GET /api/financials/payment', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))
    const { GET } = await import('@/app/api/financials/payment/route')
    const res = await GET(new Request('http://localhost/api/financials/payment') as any)
    expect(res.status).toBe(401)
  })

  it('lists owner-scoped payment schedules', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { GET } = await import('@/app/api/financials/payment/route')
    const res = await GET(new Request('http://localhost/api/financials/payment') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.items[0].status).toBe('pending')
  })
})


