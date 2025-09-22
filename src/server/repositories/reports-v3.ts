import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export type ReportDataV3 = any

function mapDbReport(row: any): { session_id: string; report: ReportDataV3 | null; status: string; attempts: number; last_error?: string | null; created_at?: string; updated_at?: string } {
	return {
		session_id: row.session_id,
		report: (row.report_json && Object.keys(row.report_json).length > 0) ? row.report_json : null,
		status: row.status,
		attempts: row.attempts ?? 0,
		last_error: row.last_error ?? null,
		created_at: row.created_at,
		updated_at: row.updated_at,
	}
}

export class ReportsV3Repository {
	constructor(private supabase: SupabaseClientAny = defaultClient) {}

	async findBySessionId(sessionId: string, _userId: string) {
		const { data: row, error } = await this.supabase
			.from('session_reports_v3')
			.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
			.eq('session_id', sessionId)
			.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			console.error('[reports-v3] findBySessionId error', { code: (error as any).code, message: error.message, sessionId })
			return null
		}
		return mapDbReport(row)
	}

	async upsertQueued(sessionId: string) {
		const payload = { 
			session_id: sessionId, 
			status: 'queued' as const, 
			report_json: {},
			attempts: 0,
			last_error: null
		}
		const { data, error } = await this.supabase
			.from('session_reports_v3')
			.upsert(payload, { onConflict: 'session_id' })
			.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
			.single()
		if (error) throw new Error(`Failed to upsert queued report: ${error.message}`)
		return mapDbReport(data)
	}

	async setRunning(sessionId: string) {
		const { data, error } = await this.supabase
			.from('session_reports_v3')
			.update({ status: 'running' })
			.eq('session_id', sessionId)
			.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
			.single()
		if (error) throw new Error(`Failed to set running: ${error.message}`)
		return mapDbReport(data)
	}

	async incrementAttempts(sessionId: string) {
		const { data, error } = await this.supabase
			.rpc('increment_report_attempts', { p_session_id: sessionId })
		// If helper function not present, fall back to update with expression
		if (error) {
			const { data: row, error: updErr } = await this.supabase
				.from('session_reports_v3')
				.update({ attempts: (await (async () => {
					const { data: cur } = await this.supabase
						.from('session_reports_v3')
						.select('attempts')
						.eq('session_id', sessionId)
						.single()
					return (cur?.attempts ?? 0) + 1
				})()) })
				.eq('session_id', sessionId)
				.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
				.single()
			if (updErr) throw new Error(`Failed to increment attempts: ${updErr.message}`)
			return mapDbReport(row)
		}
		// If RPC succeeded, fetch to map
		const { data: row2, error: selErr } = await this.supabase
			.from('session_reports_v3')
			.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
			.eq('session_id', sessionId)
			.single()
		if (selErr) throw new Error(`Failed to fetch attempts: ${selErr.message}`)
		return mapDbReport(row2)
	}

	async setReady(sessionId: string, report: ReportDataV3) {
		const { data, error } = await this.supabase
			.from('session_reports_v3')
			.update({ status: 'ready', report_json: report, last_error: null })
			.eq('session_id', sessionId)
			.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
			.single()
		if (error) throw new Error(`Failed to set ready: ${error.message}`)
		return mapDbReport(data)
	}

	async setFailed(sessionId: string, errorMsg: string) {
		const { data, error } = await this.supabase
			.from('session_reports_v3')
			.update({ status: 'failed', last_error: errorMsg })
			.eq('session_id', sessionId)
			.select('session_id, report_json, status, attempts, last_error, created_at, updated_at')
			.single()
		if (error) throw new Error(`Failed to set failed: ${error.message}`)
		return mapDbReport(data)
	}
}
