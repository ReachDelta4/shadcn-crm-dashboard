import { describe, it, expect } from 'vitest'
import { makeClientMock } from './_mocks/supabaseQueryMock'

describe('SessionsRepository org filter', () => {
  it('includes sessions with null org_id when orgId is provided', async () => {
    const { client, query } = makeClientMock()
    const { SessionsRepository } = await import('@/server/repositories/sessions')
    const repo = new SessionsRepository(client as any)

    await repo.findAll({
      userId: 'u1',
      orgId: 'org-1',
      page: 1,
      pageSize: 10,
      filters: {},
    } as any)

    expect(query._lastOrFilter).toBeDefined()
    expect(query._lastOrFilter).toContain('org_id.eq.org-1')
    expect(query._lastOrFilter).toContain('org_id.is.null')
  })
})

