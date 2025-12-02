/* eslint-disable @typescript-eslint/no-require-imports */
const { GodOrgError } = require('./errors.js')

let supabaseAdmin = null
try {
	supabaseAdmin = require('../supabase').supabaseAdmin
} catch (_) {
	// During plain node tests, TS module may not resolve; callers can inject client.
	supabaseAdmin = null
}

const ALLOWED_STATUSES = new Set(['active', 'inactive'])

function validateSeatPresets(presets = {}) {
	const normalized = {
		admins: Number(presets.admins ?? 1),
		managers: Number(presets.managers ?? 0),
		supervisors: Number(presets.supervisors ?? 0),
		users: Number(presets.users ?? 0),
	}
	for (const [key, value] of Object.entries(normalized)) {
		if (!Number.isFinite(value) || value < 0) {
			throw new GodOrgError(`Seat preset for ${key} must be a non-negative number`)
		}
	}
	return normalized
}

function validatePlanPayload(input) {
	if (!input || typeof input !== 'object') {
		throw new GodOrgError('Invalid plan payload')
	}
	const name = String(input.name || '').trim()
	if (!name) throw new GodOrgError('Plan name is required')
	const status = input.status ? String(input.status) : 'active'
	if (!ALLOWED_STATUSES.has(status)) {
		throw new GodOrgError('Invalid plan status')
	}
	const billing_mode = input.billingMode ? String(input.billingMode) : 'monthly'
	const feature_flags = typeof input.featureFlags === 'object' && input.featureFlags !== null ? input.featureFlags : {}
	const seat_presets = validateSeatPresets(input.seatPresets || input.seat_presets || {})

	return {
		name,
		status,
		billing_mode,
		feature_flags,
		seat_presets,
	}
}

async function listPlans(client = supabaseAdmin) {
	if (!client) throw new GodOrgError('Service role client not configured', 500)
	const { data, error } = await client
		.from('plans')
		.select('id,name,status,billing_mode,feature_flags,seat_presets,created_at,updated_at')
		.order('created_at', { ascending: false })
	if (error) throw new GodOrgError(`Failed to list plans: ${error.message}`, 500)
	return data || []
}

async function createPlan(payload, client = supabaseAdmin) {
	if (!client) throw new GodOrgError('Service role client not configured', 500)
	const body = validatePlanPayload(payload)
	const { data, error } = await client
		.from('plans')
		.insert(body)
		.select('id')
		.single()
	if (error) {
		if (String(error.message || '').toLowerCase().includes('duplicate')) {
			throw new GodOrgError('Plan name already exists', 409)
		}
		throw new GodOrgError(`Failed to create plan: ${error.message}`, 400)
	}
	return data
}

async function updatePlan(id, payload, client = supabaseAdmin) {
	if (!client) throw new GodOrgError('Service role client not configured', 500)
	if (!id) throw new GodOrgError('Plan id is required')
	const body = validatePlanPayload(payload)
	const { error } = await client
		.from('plans')
		.update(body)
		.eq('id', id)
	if (error) {
		if (String(error.message || '').toLowerCase().includes('duplicate')) {
			throw new GodOrgError('Plan name already exists', 409)
		}
		throw new GodOrgError(`Failed to update plan: ${error.message}`, 400)
	}
	return true
}

module.exports = {
	listPlans,
	createPlan,
	updatePlan,
	validatePlanPayload,
	validateSeatPresets,
}
