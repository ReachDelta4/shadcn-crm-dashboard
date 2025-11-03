import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeSupabaseMock(userId?: string) {
  const client = {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    rpc: vi.fn(async (fn: string) => {
      if (fn === 'get_onetime_invoice_revenue') return { data: [{ period: '2025-10', amount_minor: 1000 }] }
      if (fn === 'get_payment_schedule_revenue') return { data: [{ period: '2025-10', amount_minor: 2000 }] }
      if (fn === 'get_recurring_revenue') return { data: [{ period: '2025-10', amount_minor: 3000 }] }
      return { data: [] }
    }),
    from: vi.fn((table: string) => {
      if (table === 'invoice_payment_schedules') {
        const chain: any = {
          eq: () => chain,
          in: () => chain,
          gte: () => chain,
          lte: () => ({ data: [{ amount_minor: 2000, invoice_line_id: 'l1' }], error: null }),
        }
        return { select: () => chain }
      }
      if (table === 'recurring_revenue_schedules') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                gte: () => ({ lte: () => ({ data: [{ amount_minor: 3000, invoice_line_id: 'l2' }], error: null }) }),
              }),
            }),
          }),
        }
      }
      if (table === 'invoices') {
        return { select: () => ({ eq: () => ({ eq: () => ({ data: [{ amount: 10 }], error: null }) }) }) }
      }
      if (table === 'leads') {
        return { select: () => ({ eq: () => ({ is: () => ({ data: [{ value: 50, status: 'new' }], error: null }) }) }) }
      }
      if (table === 'invoice_lines') {
        return { select: () => ({ in: () => ({ data: [{ id: 'l1', total_minor: 2000, cogs_minor: 800 }, { id: 'l2', total_minor: 3000, cogs_minor: 1200 }], error: null }) }) }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    }),
  }
  return client as any
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

import { createServerClient } from '@supabase/ssr'

describe('GET /api/reports/revenue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))
    const { GET } = await import('@/app/api/reports/revenue/route')
    const res = await GET(new Request('http://localhost/api/reports/revenue') as any)
    expect(res.status).toBe(401)
  })

  it('merges series and computes KPIs', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('user_1'))
    const { GET } = await import('@/app/api/reports/revenue/route')
    const res = await GET(new Request('http://localhost/api/reports/revenue?groupBy=month') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.revenue?.length).toBeGreaterThan(0)
    expect(json.realized_total_minor).toBeGreaterThanOrEqual(0)
    expect(json.pending_total_minor).toBeGreaterThanOrEqual(0)
    expect(json.gross_profit_minor).toBeGreaterThanOrEqual(0)
  })
})


