/* eslint-disable @typescript-eslint/no-require-imports */
const { GodOrgError } = require('./errors.js')

function validateAdminMinimum(limits) {
	if (!Number.isFinite(limits.admins) || limits.admins < 1) {
		throw new GodOrgError('Admin seat limit must be at least 1')
	}
}

function validateSeatLimitsChange(usage, limits) {
	const roles = ['admins', 'managers', 'supervisors', 'users']
	const labels = {
		admins: 'admin seats',
		managers: 'manager seats',
		supervisors: 'supervisor seats',
		users: 'user seats',
	}
	for (const role of roles) {
		const currentUsage = usage[role] ?? 0
		const nextLimit = limits[role]
		if (!Number.isFinite(nextLimit)) {
			throw new GodOrgError(`Seat limit for ${role} must be a finite number`)
		}
		if (nextLimit < currentUsage) {
			throw new GodOrgError(`Cannot set ${labels[role]} below current usage`)
		}
	}
	validateAdminMinimum(limits)
	return true
}

module.exports = {
	validateAdminMinimum,
	validateSeatLimitsChange,
}
