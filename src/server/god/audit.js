/* eslint-disable @typescript-eslint/no-require-imports */
const { GodOrgError } = require('./errors.js')

async function listOrgAudit(orgId, client) {
	if (!orgId) throw new GodOrgError('orgId is required')
	const admin = client?.supabaseAdmin || client
	if (!admin) throw new GodOrgError('Service role client not configured', 500)
	const { data, error } = await admin
		.from('organization_audit_log')
		.select('id, action, target_type, target_id, meta, actor_user_id, created_at')
		.eq('org_id', orgId)
		.order('created_at', { ascending: false })
		.limit(50)
	if (error) throw new GodOrgError(`Failed to load audit log: ${error.message}`, 500)
	return data || []
}

module.exports = {
	listOrgAudit,
}
