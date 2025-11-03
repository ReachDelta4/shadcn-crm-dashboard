import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/auth/getUserAndScope', () => ({
  getUserAndScope: vi.fn().mockResolvedValue({
    userId: 'user-1', role: 'manager', teamId: null, orgId: null, allowedOwnerIds: ['user-1'],
  }),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    setAll: () => void 0,
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ from: () => ({}) }),
}))

const DeleteMock = vi.fn()
vi.mock('@/server/repositories/products', () => ({
  ProductsRepository: vi.fn().mockImplementation((_c?: any) => ({ delete: DeleteMock })),
}))

process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'

const importRoute = () => import('@/app/api/products/[id]/route')

describe('DELETE /api/products/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 409 when repository throws PRODUCT_IN_USE', async () => {
    DeleteMock.mockRejectedValueOnce(Object.assign(new Error('in use'), { code: 'PRODUCT_IN_USE' }))

    const { DELETE } = await importRoute()
    const res = await DELETE({} as any, { params: Promise.resolve({ id: 'prod-1' }) })
    expect(res.status).toBe(409)
  })
})
