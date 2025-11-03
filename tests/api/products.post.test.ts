import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock getUserAndScope to control auth outcomes
vi.mock('@/server/auth/getUserAndScope', () => ({
  getUserAndScope: vi.fn(),
}))

// Capture how ProductsRepository is constructed and used
vi.mock('@/server/repositories/products', () => {
  const ProductsRepository = vi.fn().mockImplementation((client?: any) => {
    // attach last ctor arg for assertions
    ;(ProductsRepository as any)._lastCtorArg = client
    return {
      // return a simple valid product shape
      create: vi.fn().mockResolvedValue({ id: 'p1', name: 'Test', price_minor: 100 }),
    }
  })
  return { ProductsRepository }
})

// Minimal shim for next/headers cookies used by createServerClient (will be used after fix)
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    setAll: () => void 0,
  }),
}))

// Ensure env vars exist for SSR client construction in route handlers
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key'

// Import after mocks
import { POST } from '@/app/api/products/route'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { ProductsRepository as MockedProductsRepository } from '@/server/repositories/products'

describe('POST /api/products', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when unauthorized', async () => {
    vi.mocked(getUserAndScope).mockRejectedValueOnce(new Error('Unauthorized'))

    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', price_minor: 100 }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('constructs repository with a Supabase client and returns 201', async () => {
    // Authorized scope
    vi.mocked(getUserAndScope).mockResolvedValueOnce({
      userId: 'user-1',
      role: 'manager',
      teamId: null,
      orgId: null,
      allowedOwnerIds: ['user-1'],
    } as any)

    const req = new Request('http://localhost/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test', price_minor: 100 }),
    })

    const res = await POST(req as any)
    expect(res.status).toBe(201)

    // Expect repository constructed with a client instance (argument provided)
    expect(MockedProductsRepository).toHaveBeenCalledTimes(1)
    const ctorArgs = (MockedProductsRepository as any).mock.calls[0]
    expect(ctorArgs.length).toBe(1)
    expect(ctorArgs[0]).toBeTruthy()
  })
})
