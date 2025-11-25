import { describe, it, expect, vi, beforeEach } from 'vitest'

function makeSupabaseMock(userId: string, memberships: any[]) {
  return {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: userId } }, error: null }))
    },
    rpc: vi.fn(async (fn: string, _params: any) => {
      if (fn === 'get_user_memberships') {
        return { data: memberships, error: null }
      }
      return { data: null, error: null }
    }),
    from: vi.fn(() => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            range: () => Promise.resolve({ data: [], error: null, count: 0 })
          })
        })
      })
    }))
  }
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

describe('Sessions API license enforcement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 402 when enterprise license is expired', async () => {
    ;(createServerClient as any).mockResolvedValueOnce(
      makeSupabaseMock('u1', [{
        org_id: 'org-1',
        org_type: 'enterprise',
        org_status: 'active',
        seat_limit_reps: 10,
        license_expires_at: '2024-12-31T23:59:59Z',
        member_role: 'sales_rep',
        member_status: 'active',
        team_id: null,
      }])
    )

    const { GET } = await import('@/app/api/sessions/route')
    const res = await GET(new Request('http://localhost/api/sessions') as any)
    expect(res.status).toBe(402)
  })
})

