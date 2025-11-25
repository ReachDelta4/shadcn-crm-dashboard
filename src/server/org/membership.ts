export type OrgMembershipRow = {
	org_id: string
	org_type: 'enterprise' | 'self_serve'
	org_status: 'active' | 'suspended'
	seat_limit_reps: number | null
	license_expires_at: string | null
	member_role: 'sales_rep' | 'supervisor' | 'manager' | 'director' | 'org_admin'
	member_status: 'active' | 'invited' | 'disabled'
	team_id: string | null
}

export type LicenseStatus = 'active' | 'license_expired' | 'license_missing' | 'suspended' | 'none'

export interface OrgScope {
	orgId: string | null
	role: OrgMembershipRow['member_role'] | null
	teamId: string | null
	licenseStatus: LicenseStatus
}

function parseDate(value: string | null): Date | null {
	if (!value) return null
	const d = new Date(value)
	return Number.isNaN(d.getTime()) ? null : d
}

function classifyLicense(m: OrgMembershipRow | null, now: Date): LicenseStatus {
	if (!m) return 'none'

	if (m.org_status !== 'active') return 'suspended'

	if (m.org_type !== 'enterprise') return 'active'

	const expiresAt = parseDate(m.license_expires_at)
	if (!expiresAt) return 'license_missing'
	if (expiresAt.getTime() < now.getTime()) return 'license_expired'

	return 'active'
}

export function deriveOrgScope(
	memberships: OrgMembershipRow[],
	now: Date = new Date()
): OrgScope {
	const normalized = memberships || []
	const active = normalized.find(
		m => m.member_status === 'active' && m.org_status === 'active'
	)
	const fallback = active || normalized[0] || null
	const licenseStatus = classifyLicense(fallback, now)

	if (!fallback) {
		return {
			orgId: null,
			role: null,
			teamId: null,
			licenseStatus
		}
	}

	return {
		orgId: fallback.org_id,
		role: fallback.member_role,
		teamId: fallback.team_id,
		licenseStatus
	}
}
