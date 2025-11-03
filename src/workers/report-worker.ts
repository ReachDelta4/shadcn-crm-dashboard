import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { generateReportV3 } from '@/server/services/report-v3'
import { generateReportV3Tabs } from '@/server/services/report-v3-tabs'

type ReportKind = 'v3' | 'tabs'

type JobClaim = {
	session_id: string
	user_id: string
	report_kind: ReportKind
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
	console.error('[report-worker] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
	process.exit(1)
}

if (!process.env.OPENROUTER_API_KEY) {
	console.warn('[report-worker] OPENROUTER_API_KEY is not set. Report generation will fail until it is configured.')
}

const POLL_INTERVAL_MS = Number(process.env.REPORT_WORKER_POLL_INTERVAL_MS ?? 5000)
const MAX_ATTEMPTS = Number(process.env.REPORT_WORKER_MAX_ATTEMPTS ?? 5)
const BATCH_SIZE = Math.max(1, Number(process.env.REPORT_WORKER_BATCH_SIZE ?? 1))

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
	auth: { persistSession: false },
	global: { headers: { 'X-Client-Info': 'report-worker/1.0.0' } },
})

async function logEvent(sessionId: string, kind: ReportKind, stage: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info', message?: string, meta?: Record<string, unknown>) {
	await supabase.from('report_generation_events').insert({
		session_id: sessionId,
		report_kind: kind,
		stage,
		level,
		message: message ?? null,
		meta: meta ?? null,
	}).then(() => {}, () => {})
}

async function claim(kind: ReportKind): Promise<JobClaim | null> {
	const { data, error } = await supabase.rpc('claim_next_session_report', {
		p_kind: kind,
		p_max_attempts: MAX_ATTEMPTS,
	})
	if (error) throw error
	const row = data?.[0]
	if (!row?.session_id || !row?.user_id) return null
	return {
		session_id: String(row.session_id),
		user_id: String(row.user_id),
		report_kind: kind,
	}
}

async function processJob(job: JobClaim) {
    await logEvent(job.session_id, job.report_kind, 'worker_claimed', 'info')
    console.info('[report-worker] processing for session', job.session_id)
	try {
		if (job.report_kind === 'v3') {
			await generateReportV3(supabase, job.user_id, job.session_id)
		} else {
			await generateReportV3Tabs(supabase, job.user_id, job.session_id)
		}
    await logEvent(job.session_id, job.report_kind, 'worker_completed', 'info')
    console.info('[report-worker] completed for session', job.session_id)
	} catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logEvent(job.session_id, job.report_kind, 'worker_failed', 'error', message?.slice(0, 500))
    console.error('[report-worker] failed for session:', job.session_id, error)
	}
}

async function runCycle(): Promise<number> {
	let processed = 0
	const kinds: ReportKind[] = ['v3', 'tabs']
	for (const kind of kinds) {
		for (let i = 0; i < BATCH_SIZE; i++) {
			let job: JobClaim | null = null
			try {
				job = await claim(kind)
        } catch (error) {
            console.error('[report-worker] failed to claim job', error)
				break
			}
			if (!job) break
			processed += 1
			await processJob(job)
		}
	}
	return processed
}

async function main() {
	console.info('[report-worker] started', { POLL_INTERVAL_MS, MAX_ATTEMPTS, BATCH_SIZE })
	while (true) {
		const processed = await runCycle().catch(error => {
			console.error('[report-worker] cycle error', error)
			return 0
		})
		if (processed === 0) {
			await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
		}
	}
}

main().catch(error => {
	console.error('[report-worker] fatal error', error)
	process.exit(1)
})
