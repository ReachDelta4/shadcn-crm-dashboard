import { describe, expect, it, vi } from 'vitest'

vi.mock('../getUserAndScope', () => ({
	getUserAndScope: vi.fn(),
}))

import { requireGod } from '../requireGod'
import { getUserAndScope } from '../getUserAndScope'

describe('requireGod', () => {
	it('returns scope when role is god', async () => {
		;(getUserAndScope as any).mockResolvedValue({
			userId: 'u-123',
			role: 'god',
			teamId: null,
			orgId: null,
			allowedOwnerIds: [],
		})

		const scope = await requireGod()

		expect(scope.role).toBe('god')
		expect(scope.allowedOwnerIds).toEqual([])
	})

	it('throws a forbidden error when role is not god', async () => {
		;(getUserAndScope as any).mockResolvedValue({
			userId: 'u-456',
			role: 'rep',
			teamId: null,
			orgId: 'org-1',
			allowedOwnerIds: ['u-456'],
		})

		await expect(requireGod()).rejects.toMatchObject({
			status: 403,
			message: expect.stringContaining('God access required'),
		})
	})
})
