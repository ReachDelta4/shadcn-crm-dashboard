import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeSupabaseMock(userId?: string, cosCount: number = 0) {
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: userId ? { id: userId } : null } })) },
    from: vi.fn((table: string) => {
      if (table === 'cos_versions') {
        return {
          select: () => ({ eq: () => ({ gte: () => ({ data: Array(cosCount).fill({ id: 'v' }), error: null }) }) })
        }
      }
      if (table === 'reports_v3_tabs') {
        return { select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: 'not found' } }) }) }) }
      }
      return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
    }),
  }
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('Sessions Chance of Sale endpoints', () => {
  beforeEach(() => vi.clearAllMocks())

  it('GET returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock(undefined))
    const { GET } = await import('@/app/api/sessions/[id]/chance-of-sale/route')
    const res = await GET(new Request('http://localhost/api/sessions/s1/chance-of-sale') as any, { params: Promise.resolve({ id: 's1' }) } as any)
    expect(res.status).toBe(401)
  })

  it('POST enforces rate limit when 3 recent versions exist', async () => {
    ;(createServerClient as any).mockReturnValueOnce(makeSupabaseMock('u1', 3))
    const { POST } = await import('@/app/api/sessions/[id]/chance-of-sale/route')
    const res = await POST(new Request('http://localhost/api/sessions/s1/chance-of-sale', { method: 'POST' }) as any, { params: Promise.resolve({ id: 's1' }) } as any)
    expect(res.status).toBe(429)
  })
})


