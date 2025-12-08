import { describe, it, expect } from 'vitest'

import { CustomersRepository } from '@/server/repositories/customers'

function makeCustomersClientMock() {
  const filters: Array<{ type: string; column: string; value?: any; values?: any[] }> = []

  const query: any = {
    eq(column: string, value: any) {
      filters.push({ type: 'eq', column, value })
      return this
    },
    in(column: string, values: any[]) {
      filters.push({ type: 'in', column, values })
      return this
    },
    select() {
      return this
    },
    order() {
      return this
    },
    range() {
      return this
    },
    async then(onFulfilled: any, _onRejected?: any) {
      const result = { data: [], error: null, count: 0 }
      return onFulfilled ? onFulfilled(result) : result
    },
  }

  const client: any = {
    from(table: string) {
      if (table !== 'customers') {
        throw new Error(`Unexpected table: ${table}`)
      }
      return query
    },
  }

  return { client, query, filters }
}

describe('CustomersRepository.list owner scope handling', () => {
  it('scopes to userId when ownerIds are undefined', async () => {
    const { client, filters } = makeCustomersClientMock()
    const repo = new CustomersRepository(client as any)

    await repo.list({ userId: 'user-1', filters: {}, sort: 'date_joined', direction: 'desc', page: 0, pageSize: 10 })

    const ownerFilters = filters.filter(f => f.column === 'owner_id')
    expect(ownerFilters.length).toBeGreaterThan(0)
  })

  it('omits owner_id filter when ownerIds is an empty array (god scope)', async () => {
    const { client, filters } = makeCustomersClientMock()
    const repo = new CustomersRepository(client as any)

    await repo.list({
      userId: 'god-user',
      ownerIds: [],
      filters: {},
      sort: 'date_joined',
      direction: 'desc',
      page: 0,
      pageSize: 10,
    })

    const ownerFilters = filters.filter(f => f.column === 'owner_id')
    expect(ownerFilters.length).toBe(0)
  })

  it('uses owner_id filter with provided non-empty ownerIds array', async () => {
    const { client, filters } = makeCustomersClientMock()
    const repo = new CustomersRepository(client as any)

    const allowedOwnerIds = ['owner-a', 'owner-b']
    await repo.list({
      userId: 'manager-user',
      ownerIds: allowedOwnerIds,
      filters: {},
      sort: 'date_joined',
      direction: 'desc',
      page: 0,
      pageSize: 10,
    })

    const ownerFilters = filters.filter(f => f.column === 'owner_id')
    expect(ownerFilters.length).toBeGreaterThan(0)
  })
})
