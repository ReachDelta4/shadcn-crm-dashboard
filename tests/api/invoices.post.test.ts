import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks common to these tests
vi.mock('@/server/auth/getUserAndScope', () => ({
  getUserAndScope: vi.fn(),
}))

// Route under test imports many repositories; we will stub minimal shapes
vi.mock('@/server/repositories/invoices', () => {
  return {
    InvoicesRepository: vi.fn().mockImplementation(() => ({
      create: vi.fn().mockResolvedValue({ id: 'inv_1', amount: 123.45, customer_name: 'Acme' }),
      list: vi.fn(),
    })),
  }
})

vi.mock('@/server/repositories/invoice-lines', () => {
  return {
    InvoiceLinesRepository: vi.fn().mockImplementation(() => ({
      bulkCreate: vi.fn().mockImplementation(async (rows: any[]) => rows.map((r, i) => ({ ...r, id: `line_${i+1}` }))),
    })),
  }
})

vi.mock('@/server/repositories/invoice-schedules', () => {
  return {
    InvoicePaymentSchedulesRepository: vi.fn().mockImplementation(() => ({
      bulkCreate: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
    })),
    RecurringRevenueSchedulesRepository: vi.fn().mockImplementation(() => ({
      bulkCreate: vi.fn().mockResolvedValue([]),
    })),
  }
})

vi.mock('@/server/repositories/products', () => {
  return {
    ProductsRepository: vi.fn().mockImplementation(() => ({
      getById: vi.fn().mockImplementation(async (id: string) => ({
        id,
        name: 'Widget',
        price_minor: 1000,
        tax_rate_bp: 1800,
        cogs_type: 'percent',
        cogs_value: 2500,
        discount_type: null,
        discount_value: null,
        currency: 'INR',
      })),
    })),
  }
})

vi.mock('@/server/repositories/product-payment-plans', () => {
  return {
    ProductPaymentPlansRepository: vi.fn().mockImplementation(() => ({
      getById: vi.fn().mockResolvedValue({
        id: 'plan_1',
        name: '3 x Monthly',
        num_installments: 3,
        interval_type: 'monthly',
        interval_days: null,
        down_payment_minor: 0,
        active: true,
      }),
    })),
  }
})

vi.mock('@/server/repositories/leads', () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({ id: 'lead_1', subject_id: null, status: 'qualified' }),
  })),
}))

// Use real pricing engine implementation (no mock)

// SSR client mock per test
function makeSupabaseMock(opts: { userId?: string; selectInvoiceByExternal?: any } = {}) {
  const userId = opts.userId
  const selectInvoiceByExternal = opts.selectInvoiceByExternal
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from: vi.fn((table: string) => {
      if (table === 'invoices' && selectInvoiceByExternal) {
        return {
          select: () => ({ eq: (_k: string, _v: any) => ({ eq: (_k2: string, _v2: any) => ({ single: () => ({ data: selectInvoiceByExternal, error: null }) }) }) }),
        }
      }
      if (table === 'invoice_payment_schedules') {
        return { select: vi.fn().mockReturnValue({ order: () => ({ limit: () => ({ eq: () => ({ gte: () => ({ lte: () => ({ data: [], error: null }) }) }) }) }) }) }
      }
      if (table === 'recurring_revenue_schedules') {
        return { select: vi.fn().mockReturnValue({ order: () => ({ limit: () => ({ eq: () => ({ gte: () => ({ lte: () => ({ data: [], error: null }) }) }) }) }) }) }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    }),
    rpc: vi.fn(),
  }
}

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

// Minimal Next headers is already mocked in setup

import { createServerClient } from '@supabase/ssr'
import { getUserAndScope } from '@/server/auth/getUserAndScope'

describe('POST /api/invoices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock({ userId: undefined }))

    const { POST } = await import('@/app/api/invoices/route')
    const req = new Request('http://localhost/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_name: 'Acme', email: 'a@b.com' }),
    })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('rejects payment plan for recurring product', async () => {
    ;(getUserAndScope as any).mockResolvedValueOnce({ userId: 'user_1', role: 'member', orgId: null })
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock({ userId: 'user_1' }))

    // Override ProductsRepository.getById to return a recurring product
    const { ProductsRepository } = await import('@/server/repositories/products')
    ;(ProductsRepository as any).mockImplementation(() => ({
      getById: vi.fn().mockResolvedValue({
        id: 'prod_rec',
        name: 'Subscription',
        price_minor: 5000,
        tax_rate_bp: 0,
        cogs_type: null,
        cogs_value: null,
        discount_type: null,
        discount_value: null,
        currency: 'INR',
        recurring_interval: 'monthly',
        recurring_interval_days: null,
      }),
    }))

    const { POST } = await import('@/app/api/invoices/route')
    const body = {
      customer_name: 'Acme',
      email: 'a@b.com',
      line_items: [
        { product_id: 'prod_rec', quantity: 1, payment_plan_id: 'plan_1' },
      ],
    }
    const res = await POST(new Request('http://localhost/api/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }) as any)
    expect(res.status).toBe(400)
  })

  it('is idempotent when Idempotency-Key triggers unique violation', async () => {
    ;(getUserAndScope as any).mockResolvedValueOnce({ userId: 'user_1', role: 'member', orgId: null })
    // Supabase mock will return an existing invoice on lookup after unique error
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock({ userId: 'user_1', selectInvoiceByExternal: { id: 'existing_inv' } }))

    // Make InvoicesRepository.create throw unique violation
    const { InvoicesRepository } = await import('@/server/repositories/invoices')
    ;(InvoicesRepository as any).mockImplementation(() => ({
      create: vi.fn().mockRejectedValue(new Error('unique_invoice_external_id_per_owner')),
    }))

    const { POST } = await import('@/app/api/invoices/route')
    const res = await POST(new Request('http://localhost/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'idem-123' },
      body: JSON.stringify({ customer_name: 'Acme', email: 'a@b.com', line_items: [] }),
    }) as any)
    expect(res.status).toBe(200)
    const payload = await res.json()
    expect(payload.id).toBe('existing_inv')
  })
})


