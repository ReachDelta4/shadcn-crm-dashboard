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
          data: [{ amount_minor: 2000, invoice_line_id: 'l1' }],
          error: null,
          eq: () => chain,
          in: () => chain,
          gte: () => chain,
          lte: () => chain,
          then: (resolve: any) => resolve({ data: chain.data, error: chain.error }),
        }
        return { select: () => chain }
      }
      if (table === 'recurring_revenue_schedules') {
        const chain: any = {
          data: [{ amount_minor: 3000, invoice_line_id: 'l2' }],
          error: null,
          eq: () => chain,
          gte: () => chain,
          lte: () => chain,
          then: (resolve: any) => resolve({ data: chain.data, error: chain.error }),
        }
        return { select: () => chain }
      }
      if (table === 'invoices') {
        return { select: () => ({ eq: () => ({ eq: () => ({ data: [{ amount: 10 }], error: null }) }) }) }
      }
      if (table === 'leads') {
        return { select: () => ({ eq: () => ({ is: () => ({ data: [{ value: 50, status: 'new' }], error: null }) }) }) }
      }
      if (table === 'invoice_lines') {
        return {
          select: () => ({
            in: () => ({
              data: [
                { id: 'l1', total_minor: 2000, cogs_minor: 800, tax_minor: 360 },
                { id: 'l2', total_minor: 3000, cogs_minor: 1200, tax_minor: 540 },
              ],
              error: null,
            }),
          }),
        }
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
    // With the mock above:
    // - paid schedules: 2000
    // - billed recurring: 3000
    // - onetime realized: 0
    // => realized_total_minor = 5000
    expect(json.realized_total_minor).toBe(5000)
    // Tax per lines: 360 + 540 = 900
    expect(json.realized_tax_minor).toBe(900)
    // Net revenue excludes tax
    expect(json.realized_net_revenue_minor).toBe(4100)
    // COGS per lines: 800 + 1200 = 2000
    expect(json.gross_profit_minor).toBe(2100)
    expect(json.gross_margin_percent).toBeCloseTo((2100 * 100) / 4100, 5)
  })
})
