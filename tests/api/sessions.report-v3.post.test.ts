import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

function makeSupabaseMock(userId?: string, pendingCount: number = 0) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'session_reports_v3') {
        return {
          select: (_cols: string, _opts?: any) => ({
            in: (_column: string, _values: string[]) =>
              Promise.resolve({ count: pendingCount, error: null }),
          }),
        }
      }
      return {
        select: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
    }),
  }
}

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
import { createServerClient } from '@supabase/ssr'

const originalMaxPending = process.env.REPORT_V3_MAX_PENDING_PER_USER
process.env.REPORT_V3_MAX_PENDING_PER_USER = '1'

describe('POST /api/sessions/[id]/report-v3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    process.env.REPORT_V3_MAX_PENDING_PER_USER = originalMaxPending
  })

  it('returns 401 when unauthorized', async () => {
    ;(createServerClient as any).mockResolvedValueOnce(makeSupabaseMock(undefined, 0))
    const { POST } = await import('@/app/api/sessions/[id]/report-v3/route')
    const res = await POST(
      new Request('http://localhost/api/sessions/s1/report-v3', { method: 'POST' }) as any,
      { params: Promise.resolve({ id: 's1' }) } as any,
    )
    expect(res.status).toBe(401)
  })

  it('returns 429 when user has too many pending reports', async () => {
    ;(createServerClient as any).mockResolvedValueOnce(makeSupabaseMock('user-1', 1))
    const { POST } = await import('@/app/api/sessions/[id]/report-v3/route')
    const res = await POST(
      new Request('http://localhost/api/sessions/s1/report-v3', { method: 'POST' }) as any,
      { params: Promise.resolve({ id: 's1' }) } as any,
    )
    expect(res.status).toBe(429)
  })
})
