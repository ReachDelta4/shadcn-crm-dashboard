import { describe, it, expect, vi, beforeEach } from 'vitest'

const adminRpc = vi.fn(async () => ({ data: { id: 'member-2' }, error: null }))
const adminFrom = vi.fn((table: string) => {
	if (table === 'organization_members') {
		return {
			select: () => ({
				eq: () => ({
					order: () => Promise.resolve({ data: [], error: null })
				})
			}),
			update: () => ({
				eq: () => ({
					eq: () => ({
						select: () => ({
							single: () => Promise.resolve({ data: { id: 'member-1', status: 'active' }, error: null })
						})
					})
				})
			})
		}
	}
	if (table === 'organizations') {
		return {
			select: () => ({
				eq: () => ({
					single: () => Promise.resolve({ data: { seat_limit_reps: 5, license_expires_at: null }, error: null })
				})
			})
		}
	}
	return { select: () => ({}) }
})

vi.mock('@supabase/ssr', () => ({
	createServerClient: vi.fn()
}))

vi.mock('@/server/supabase', () => ({
	supabaseAdmin: {
		rpc: adminRpc,
		from: adminFrom
	}
}))

const makeSupabaseMock = (memberships: any[], userId = 'user-1') => ({
	auth: {
		getUser: vi.fn(async () => ({
			data: { user: userId ? { id: userId, email: 'user@example.com' } : null },
			error: null
		}))
	},
	rpc: vi.fn(async (fn: string) => {
		if (fn === 'get_user_memberships') {
			return { data: memberships, error: null }
		}
		return { data: null, error: null }
	})
})

describe('Org members API', () => {
	let createServerClientMock: any

	beforeEach(async () => {
		const mod = await import('@supabase/ssr')
		createServerClientMock = mod.createServerClient as any
		createServerClientMock.mockReset()
		adminRpc.mockReset()
		adminFrom.mockReset()
	})

	function mockSession(memberships: any[], userId = 'user-1') {
		const supabase = makeSupabaseMock(memberships, userId)
		createServerClientMock.mockResolvedValue(supabase)
	}

	it('GET returns 402 when license expired', async () => {
		mockSession([{
			org_id: 'org-1',
			org_type: 'enterprise',
			org_status: 'active',
			member_role: 'org_admin',
			member_status: 'active',
			license_expires_at: '2024-01-01T00:00:00Z'
		}])
		const { GET } = await import('@/app/api/org/members/route')
		const res = await GET(new Request('http://localhost/api/org/members') as any)
		expect(res.status).toBe(402)
	})

	it('POST allows org admins to add members', async () => {
		mockSession([{
			org_id: 'org-1',
			org_type: 'enterprise',
			org_status: 'active',
			member_role: 'org_admin',
			member_status: 'active',
			license_expires_at: '2025-12-31T00:00:00Z'
		}])
		const { POST } = await import('@/app/api/org/members/route')
		const res = await POST(new Request('http://localhost/api/org/members', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: 'new-user', role: 'sales_rep' })
		}) as any)
		expect(res.status).toBe(201)
		expect(adminRpc).toHaveBeenCalled()
	})

	it('POST blocks non-admin members', async () => {
		mockSession([{
			org_id: 'org-1',
			org_type: 'enterprise',
			org_status: 'active',
			member_role: 'sales_rep',
			member_status: 'active',
			license_expires_at: '2025-12-31T00:00:00Z'
		}])
		const { POST } = await import('@/app/api/org/members/route')
		const res = await POST(new Request('http://localhost/api/org/members', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId: 'new-user', role: 'sales_rep' })
		}) as any)
		expect(res.status).toBe(403)
	})
})
