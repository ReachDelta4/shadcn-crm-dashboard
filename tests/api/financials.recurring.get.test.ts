import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeSupabaseMock(userId?: string) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from: vi.fn((table: string) => {
      if (table === 'recurring_revenue_schedules') {
        const chain: any = {
          order: () => chain,
          limit: () => chain,
          eq: () => chain,
          in: () => ({ data: [
            { id: 'rr1', invoice_line_id: 'l1', cycle_num: 1, billing_at_utc: new Date().toISOString(), amount_minor: 2000, description: 'Bill 1', status: 'scheduled' },
          ], error: null }),
          gte: () => chain,
          lte: () => chain,
        }
        return { select: () => chain }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    })
  }
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('GET /api/financials/recurring', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))
    const { GET } = await import('@/app/api/financials/recurring/route')
    const res = await GET(new Request('http://localhost/api/financials/recurring') as any)
    expect(res.status).toBe(401)
  })

  it('lists owner-scoped recurring schedules', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1'))
    const { GET } = await import('@/app/api/financials/recurring/route')
    const res = await GET(new Request('http://localhost/api/financials/recurring') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.items)).toBe(true)
    expect(json.items[0].status).toBe('scheduled')
  })
})


