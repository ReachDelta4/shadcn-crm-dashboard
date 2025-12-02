import { describe, it, expect } from 'vitest'

// Build a minimal client mock that returns different rows per table
function makeClient({ sessions, customers, leads }: { sessions: any[]; customers: any[]; leads: any[] }) {
  return {
    from(table: string) {
      const chain: any = {
        _table: table,
        _select: '*',
        _filters: {} as Record<string, any>,
        select(cols?: string) { this._select = cols || '*'; return this },
        eq(col: string, val: any) { this._filters[col] = val; return this },
        in(col: string, vals: any[]) { this._filters[col] = vals; return this },
        order() { return this },
        range() { return this },
        then(resolve: any) {
          // sessions list branch returns data, count
          if (this._table === 'sessions') {
            resolve({ data: sessions, error: null, count: sessions.length })
            return
          }
          // customers / leads bulk phone lookup
          if (this._table === 'customers') {
            const ids = this._filters['subject_id'] || []
            const owner = this._filters['owner_id']
            const data = customers.filter(r => (!ids.length || ids.includes(r.subject_id)) && (!owner || r.owner_id === owner))
            resolve({ data, error: null })
            return
          }
          if (this._table === 'leads') {
            const ids = this._filters['subject_id'] || []
            const owner = this._filters['owner_id']
            const data = leads.filter(r => (!ids.length || ids.includes(r.subject_id)) && (!owner || r.owner_id === owner))
            resolve({ data, error: null })
            return
          }
          resolve({ data: [], error: null })
        }
      }
      return chain
    }
  } as any
}

describe('SessionsRepository.findAll phone enrichment', () => {
  it('prefers customer phone over lead phone for the same subject', async () => {
    const subjectId = 'subj-1'
    const sessions = [{ id: 's1', user_id: 'u1', subject_id: subjectId, title_enc: 'Session', session_type: 'ask', started_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
    const customers = [{ subject_id: subjectId, phone: '999-111', owner_id: 'u1' }]
    const leads = [{ subject_id: subjectId, phone: '888-222', owner_id: 'u1' }]
    const client = makeClient({ sessions, customers, leads })
    const { SessionsRepository } = await import('@/server/repositories/sessions')
    const repo = new SessionsRepository(client)
    const res = await repo.findAll({ userId: 'u1', page: 1, pageSize: 10 })
    expect(res.sessions[0].phone).toBe('999-111')
  })

  it('falls back to lead phone when customer missing', async () => {
    const subjectId = 'subj-2'
    const sessions = [{ id: 's2', user_id: 'u1', subject_id: subjectId, title_enc: 'Session', session_type: 'ask', started_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
    const customers: any[] = []
    const leads = [{ subject_id: subjectId, phone: '777-333', owner_id: 'u1' }]
    const client = makeClient({ sessions, customers, leads })
    const { SessionsRepository } = await import('@/server/repositories/sessions')
    const repo = new SessionsRepository(client)
    const res = await repo.findAll({ userId: 'u1', page: 1, pageSize: 10 })
    expect(res.sessions[0].phone).toBe('777-333')
  })

  it('uses DB started_at time (UTC text) for fallback title', async () => {
    const sessions = [{
      id: 's3',
      user_id: 'u1',
      subject_id: null,
      title_enc: null,
      session_type: 'listen',
      started_at: '2025-11-27 13:34:03.140206+00',
      ended_at: '2025-11-27 13:35:09.33279+00',
      updated_at: '2025-11-27 13:35:09.33279+00',
    }]
    const client = makeClient({ sessions, customers: [], leads: [] })
    const { SessionsRepository } = await import('@/server/repositories/sessions')
    const repo = new SessionsRepository(client)
    const res = await repo.findAll({ userId: 'u1', page: 1, pageSize: 10 })
    expect(res.sessions[0].title).toBe('Session @ 13:34:03')
  })
})
