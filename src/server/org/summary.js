/* eslint-disable @typescript-eslint/no-require-imports */
const { computeOrgHealth } = require('../god/health.js')

function summarizeOrgProfile({ org, usage, pendingInvites, now = new Date() }) {
	if (!org) throw new Error('org is required')
	const seatLimits = {
		admins: org.seat_limit_admins ?? 0,
		managers: org.seat_limit_managers ?? 0,
		supervisors: org.seat_limit_supervisors ?? 0,
		users: org.seat_limit_users ?? 0,
	}
	const seatUsage = {
		admins: usage?.admins ?? 0,
		managers: usage?.managers ?? 0,
		supervisors: usage?.supervisors ?? 0,
		users: usage?.users ?? 0,
	}
	const health = computeOrgHealth(
		{
			status: org.status,
			licenseExpiresAt: org.license_expires_at,
			seatUsage,
			seatLimits,
		},
		now,
	)
	return {
		orgId: org.id,
		orgName: org.name,
		planId: org.plan_id || null,
		planName: org.plans?.name || null,
		license: {
			expiresAt: org.license_expires_at || null,
			status: health.licenseExpired ? 'expired' : health.licenseExpiringSoon ? 'expiring' : 'active',
		},
		seatLimits,
		seatUsage,
		invites: {
			pending: pendingInvites ?? 0,
		},
		health,
	}
}

module.exports = {
	summarizeOrgProfile,
}
