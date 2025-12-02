function computeOrgHealth(org, now = new Date()) {
	const flags = {
		licenseExpired: false,
		licenseExpiringSoon: false,
		seatOverage: false,
		suspended: org.status !== 'active',
	}

	// License checks
	if (org.licenseExpiresAt) {
		const expiry = new Date(org.licenseExpiresAt)
		if (!Number.isNaN(expiry.getTime())) {
			if (expiry.getTime() < now.getTime()) {
				flags.licenseExpired = true
			} else {
				const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
				if (diffDays <= 14) {
					flags.licenseExpiringSoon = true
				}
			}
		}
	}

	// Seat overage
	const usage = org.seatUsage || {}
	const limits = org.seatLimits || {}
	const roles = ['admins', 'managers', 'supervisors', 'users']
	flags.seatOverage = roles.some((role) => {
		const used = usage[role] ?? 0
		const limit = limits[role] ?? 0
		return limit >= 0 && used > limit
	})

	return flags
}

module.exports = {
	computeOrgHealth,
}
