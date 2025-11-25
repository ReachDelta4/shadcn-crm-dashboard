import type { SupabaseClient } from '@supabase/supabase-js'
import type { OrgScope } from './membership'
import { deriveOrgScope } from './membership'

export async function fetchOrgScope(
	client: SupabaseClient,
	userId: string
): Promise<OrgScope> {
	try {
		const { data, error } = await (client as any).rpc('get_user_memberships', { p_user_id: userId })
		if (error) throw error
		return deriveOrgScope(data || [])
	} catch (error: any) {
		const message = String(error?.message || '')
		if (/get_user_memberships/i.test(message) || /does not exist/i.test(message)) {
			// Fail open for legacy environments where the RPC is not yet deployed
			return deriveOrgScope([])
		}
		throw error
	}
}

export function ensureLicenseActive(scope: OrgScope) {
	if (scope.licenseStatus === 'license_expired') {
		const error = new Error('License Expired, please contact Salesy')
		;(error as any).statusCode = 402
		throw error
	}
	if (scope.licenseStatus === 'suspended') {
		const error = new Error('Organization suspended')
		;(error as any).statusCode = 403
		throw error
	}
}

export function ensureOrgAdmin(scope: OrgScope) {
	if (!scope.role || !['org_admin', 'director'].includes(scope.role)) {
		const error = new Error('Insufficient permissions')
		;(error as any).statusCode = 403
		throw error
	}
}
