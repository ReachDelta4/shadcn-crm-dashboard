import type { SupabaseClient } from '@supabase/supabase-js'

interface ActivityPayload {
	type: 'user' | 'contact' | 'lead' | 'deal' | 'task' | 'email'
	description: string
	user?: string
	entity?: string
	details?: Record<string, any>
	timestamp?: string
}

export async function logActivity(
	supabase: SupabaseClient,
	ownerId: string,
	payload: ActivityPayload
): Promise<void> {
	try {
		const nowIso = new Date().toISOString()
		const row: Record<string, any> = {
			owner_id: ownerId,
			type: payload.type,
			description: payload.description,
			message: payload.description,
			user: payload.user || 'system',
			entity: payload.entity || null,
			details: payload.details || null,
			metadata: payload.details || null,
			timestamp: payload.timestamp || nowIso,
		}
		await supabase.from('activity_logs').insert(row)
	} catch {
		// Never throw from logging
	}
}
