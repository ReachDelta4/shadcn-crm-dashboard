export type LifecycleEnforcementMode = 'off' | 'log_only' | 'enforce'

function readBoolean(name: string, defaultValue: boolean): boolean {
	const v = process.env[name]
	if (v === undefined || v === null || v === '') return defaultValue
	return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase())
}

function readNumber(name: string, defaultValue: number): number {
	const v = process.env[name]
	if (!v) return defaultValue
	const n = Number(v)
	return Number.isFinite(n) ? n : defaultValue
}

function readMode(name: string, defaultValue: LifecycleEnforcementMode): LifecycleEnforcementMode {
	const v = (process.env[name] || '').toLowerCase()
	if (v === 'off' || v === 'log_only' || v === 'enforce') return v
	return defaultValue
}

export const flags = {
	lifecycleEnforcement: readMode('LIFECYCLE_ENFORCEMENT_MODE', 'off') as LifecycleEnforcementMode,
	calendarIntegrationEnabled: readBoolean('CALENDAR_INTEGRATION_ENABLED', false),
	allowInvoiceDraft: readBoolean('ALLOW_INVOICE_DRAFT', true),
	notificationsThrottleMs: readNumber('NOTIFICATIONS_THROTTLE_MS', 5 * 60 * 1000),
	isProduction: process.env.NODE_ENV === 'production',
	isDevelopment: process.env.NODE_ENV !== 'production',
	godUserIds: (process.env.GOD_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean),
}
