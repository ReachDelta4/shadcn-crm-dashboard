import { describe, it, expect } from 'vitest'
import { makeClientMock } from './_mocks/supabaseQueryMock'

describe('Repositories: use estimated counts for list()', () => {
  it('products.list uses count: estimated and explicit columns', async () => {
    const { client, query } = makeClientMock()
    const { ProductsRepository } = await import('@/server/repositories/products')
    const repo = new ProductsRepository(client as any)
    await repo.list({ ownerId: 'u1', role: 'rep', orgId: null, active: true, page: 0, pageSize: 10 })
    expect(query._selectOpts?.count).toBe('estimated')
    // ensure not selecting *
    // @ts-ignore - captured via mock
    expect(query._lastSelectColumns || '').not.toContain('*')
  })

  it('customers.list uses count: estimated', async () => {
    const { client, query } = makeClientMock()
    const { CustomersRepository } = await import('@/server/repositories/customers')
    const repo = new CustomersRepository(client as any)
    await repo.list({ userId: 'u1', page: 0, pageSize: 10, filters: {} })
    expect(query._selectOpts?.count).toBe('estimated')
  })

  it('leads.list uses count: estimated', async () => {
    const { client, query } = makeClientMock()
    const { LeadsRepository } = await import('@/server/repositories/leads')
    const repo = new LeadsRepository(client as any)
    await repo.list({ userId: 'u1', page: 0, pageSize: 10, filters: {} })
    expect(query._selectOpts?.count).toBe('estimated')
  })

  it('invoices.list uses count: estimated', async () => {
    const { client, query } = makeClientMock()
    const { InvoicesRepository } = await import('@/server/repositories/invoices')
    const repo = new InvoicesRepository(client as any)
    await repo.list({ userId: 'u1', page: 0, pageSize: 10, filters: {} })
    expect(query._selectOpts?.count).toBe('estimated')
  })

  it('sessions.findAll uses count: estimated', async () => {
    const { client, query } = makeClientMock()
    const { SessionsRepository } = await import('@/server/repositories/sessions')
    const repo = new SessionsRepository(client as any)
    await repo.findAll({ userId: 'u1', page: 1, pageSize: 10, filters: {} })
    expect(query._selectOpts?.count).toBe('estimated')
  })
})
