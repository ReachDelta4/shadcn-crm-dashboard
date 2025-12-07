import { describe, it, expect } from 'vitest'

import { LeadsRepository } from '@/server/repositories/leads'

function makeLeadsClientMock() {
  const filters: Array<{ type: string; column: string; value?: any; values?: any[] }> = []

  const query: any = {
    _updatePayload: undefined as any,
    update(payload: any) {
      this._updatePayload = payload
      return this
    },
    eq(column: string, value: any) {
      filters.push({ type: 'eq', column, value })
      return this
    },
    in(column: string, values: any[]) {
      filters.push({ type: 'in', column, values })
      return this
    },
    is(column: string, value: any) {
      filters.push({ type: 'is', column, value })
      return this
    },
    select() {
      return this
    },
    async single() {
      return { data: { id: 'lead-1' }, error: null }
    },
  }

  const client: any = {
    from(table: string) {
      if (table !== 'leads') {
        throw new Error(`Unexpected table: ${table}`)
      }
      return query
    },
  }

  return { client, query, filters }
}

describe('LeadsRepository.update owner scope handling', () => {
  it('uses owner_id filter scoped to user when ownerIds are undefined', async () => {
    const { client, filters } = makeLeadsClientMock()
    const repo = new LeadsRepository(client as any)

    await (repo as any).update('lead-1', { status: 'qualified' } as any, 'user-123')

    const ownerFilters = filters.filter(f => f.column === 'owner_id')
    expect(ownerFilters.length).toBeGreaterThan(0)
  })

  it('omits owner_id filter when ownerIds is an empty array (god scope)', async () => {
    const { client, filters } = makeLeadsClientMock()
    const repo = new LeadsRepository(client as any)

    await (repo as any).update('lead-1', { status: 'qualified' } as any, 'god-user', [])

    const ownerFilters = filters.filter(f => f.column === 'owner_id')
    expect(ownerFilters.length).toBe(0)
  })

  it('uses owner_id filter with provided non-empty ownerIds array', async () => {
    const { client, filters } = makeLeadsClientMock()
    const repo = new LeadsRepository(client as any)

    const allowedOwnerIds = ['owner-a', 'owner-b']
    await (repo as any).update('lead-1', { status: 'qualified' } as any, 'manager-user', allowedOwnerIds)

    const ownerFilters = filters.filter(f => f.column === 'owner_id')
    expect(ownerFilters.length).toBeGreaterThan(0)
  })
}
)

