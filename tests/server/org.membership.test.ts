import { describe, it, expect } from 'vitest'
import { deriveOrgScope, type OrgMembershipRow } from '@/server/org/membership'

function baseMembership(overrides: Partial<OrgMembershipRow> = {}): OrgMembershipRow {
	return {
		org_id: 'org-1',
		org_type: 'enterprise',
		org_status: 'active',
		seat_limit_reps: 10,
		license_expires_at: '2025-12-31T23:59:59Z',
		member_role: 'sales_rep',
		member_status: 'active',
		team_id: null,
		...overrides
	}
}

describe('deriveOrgScope', () => {
	it('returns none when there are no memberships', () => {
		const scope = deriveOrgScope([], new Date('2025-01-01T00:00:00Z'))
		expect(scope.orgId).toBeNull()
		expect(scope.licenseStatus).toBe('none')
	})

	it('selects active membership and marks license active for enterprise before expiry', () => {
		const m = baseMembership({
			license_expires_at: '2025-12-31T23:59:59Z'
		})
		const scope = deriveOrgScope([m], new Date('2025-01-01T00:00:00Z'))
		expect(scope.orgId).toBe('org-1')
		expect(scope.role).toBe('sales_rep')
		expect(scope.licenseStatus).toBe('active')
	})

	it('marks license_expired when enterprise license is past expiry', () => {
		const m = baseMembership({
			license_expires_at: '2024-12-31T23:59:59Z'
		})
		const scope = deriveOrgScope([m], new Date('2025-01-01T00:00:00Z'))
		expect(scope.licenseStatus).toBe('license_expired')
	})

	it('treats self_serve orgs as active regardless of license_expires_at', () => {
		const m = baseMembership({
			org_type: 'self_serve',
			license_expires_at: null
		})
		const scope = deriveOrgScope([m], new Date('2025-01-01T00:00:00Z'))
		expect(scope.licenseStatus).toBe('active')
	})

	it('returns suspended when org_status is not active', () => {
		const m = baseMembership({
			org_status: 'suspended'
		})
		const scope = deriveOrgScope([m], new Date('2025-01-01T00:00:00Z'))
		expect(scope.licenseStatus).toBe('suspended')
	})
})

