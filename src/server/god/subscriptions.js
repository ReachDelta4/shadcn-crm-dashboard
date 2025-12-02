/* eslint-disable @typescript-eslint/no-require-imports */
const { GodOrgError } = require('./errors.js')

let supabaseAdmin = null
try {
	supabaseAdmin = require('../supabase').supabaseAdmin
} catch (_) {
	supabaseAdmin = null
}

const ALLOWED_BILLING_STATUS = new Set(['active', 'past_due', 'canceled'])
const ALLOWED_RENEWAL = new Set(['auto_renew', 'manual'])

function validateDate(value, field) {
	if (value === null || value === undefined) return null
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) {
		throw new GodOrgError(`Invalid date for ${field}`)
	}
	return d.toISOString()
}

function validateSubscriptionPayload(input) {
	if (!input || typeof input !== 'object') throw new GodOrgError('Invalid subscription payload')
	const billing_status = input.billingStatus || input.billing_status
	if (billing_status && !ALLOWED_BILLING_STATUS.has(billing_status)) {
		throw new GodOrgError('Invalid billing status')
	}
	const renewal_mode = input.renewalMode || input.renewal_mode
	if (renewal_mode && !ALLOWED_RENEWAL.has(renewal_mode)) {
		throw new GodOrgError('Invalid renewal mode')
	}
	const trial_end = validateDate(input.trialEnd || input.trial_end, 'trial_end')
	const current_period_end = validateDate(input.currentPeriodEnd || input.current_period_end, 'current_period_end')
	const warning_at = validateDate(input.warningAt || input.warning_at, 'warning_at')
	const plan_id = input.planId || input.plan_id || null

	return {
		billing_status,
		renewal_mode,
		trial_end,
		current_period_end,
		warning_at,
		plan_id,
	}
}

async function updateSubscription(orgId, payload, client = supabaseAdmin) {
	if (!client) throw new GodOrgError('Service role client not configured', 500)
	if (!orgId) throw new GodOrgError('orgId is required')
	const body = validateSubscriptionPayload(payload)
	const { data: existing, error: loadErr } = await client
		.from('organization_subscriptions')
		.select('id')
		.eq('org_id', orgId)
		.maybeSingle()
	if (loadErr) throw new GodOrgError(`Failed to load subscription: ${loadErr.message}`, 500)

	let query
	if (existing) {
		query = client.from('organization_subscriptions').update(body).eq('org_id', orgId)
	} else {
		query = client.from('organization_subscriptions').insert({ ...body, org_id: orgId })
	}
	const { error: updErr } = await query
	if (updErr) throw new GodOrgError(`Failed to update subscription: ${updErr.message}`, 400)
	return true
}

module.exports = {
	validateSubscriptionPayload,
	updateSubscription,
}
