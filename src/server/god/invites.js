/* eslint-disable @typescript-eslint/no-require-imports */
const { GodOrgError } = require('./errors.js')

function validateInviteAction(body) {
	if (!body || typeof body !== 'object') {
		throw new GodOrgError('Invalid payload')
	}
	const action = String(body.action || '').toLowerCase()
	const inviteId = body.inviteId
	if (!inviteId || typeof inviteId !== 'string') {
		throw new GodOrgError('inviteId is required')
	}
	if (!['revoke', 'resend', 'extend'].includes(action)) {
		throw new GodOrgError('Invalid invite action')
	}
	if (action === 'extend') {
		const days = Number(body.expiresInDays)
		if (!Number.isInteger(days) || days < 1 || days > 90) {
			throw new GodOrgError('expiresInDays must be between 1 and 90')
		}
		return { action, inviteId, expiresInDays: days }
	}
	return { action, inviteId }
}

module.exports = {
	validateInviteAction,
}
