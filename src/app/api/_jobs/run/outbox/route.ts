import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getServerClient() {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
            },
        }
    )
}

export async function POST(request: NextRequest) {
    try {
        const token = request.headers.get('authorization')?.replace(/Bearer\s+/i, '')
        if (!token || token !== process.env.JOB_RUNNER_TOKEN) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const supabase = await getServerClient()
        const nowIso = new Date().toISOString()

        // Fetch due jobs
        const { data: jobs, error: jobsErr } = await supabase
            .from('outbox_jobs')
            .select('id, job_type, payload, attempts')
            .eq('status', 'pending')
            .lte('next_run_at', nowIso)
            .limit(100)
        if (jobsErr) throw jobsErr

        let processed = 0
        for (const job of jobs || []) {
            try {
                if (job.job_type === 'appointment_outcome_eval') {
                    const apptId = job.payload?.appointment_id
                    if (apptId) {
                        // Load appointment
                        const { data: appt, error: apptErr } = await supabase
                            .from('lead_appointments')
                            .select('id, lead_id, subject_id, status, start_at_utc, end_at_utc, call_outcome, call_verified_session_id')
                            .eq('id', apptId)
                            .maybeSingle()
                        if (apptErr) throw apptErr
                        if (!appt) throw new Error('appointment not found')

                        // If already completed with outcome, skip
                        if (appt.status !== 'scheduled' && appt.call_outcome) {
                            await supabase.from('outbox_jobs').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', job.id)
                            processed++
                            continue
                        }

                        // Check sessions overlapping time window
                        const startBuffer = new Date(new Date(appt.start_at_utc).getTime() - 15 * 60 * 1000).toISOString()
                        const endBuffer = new Date(new Date(appt.end_at_utc).getTime() + 120 * 60 * 1000).toISOString()
                        const { data: sessions, error: sessErr } = await supabase
                            .from('sessions')
                            .select('id, subject_id, started_at, ended_at')
                            .gte('started_at', startBuffer)
                            .lte('started_at', endBuffer)
                            .order('started_at', { ascending: true })
                        if (sessErr) throw sessErr

                        const match = (sessions || []).find(s => !appt.subject_id || s.subject_id === appt.subject_id)
                        if (match) {
                            await supabase
                                .from('lead_appointments')
                                .update({ status: 'completed', call_outcome: 'taken', call_verified_session_id: match.id })
                                .eq('id', appt.id)
                        } else {
                            await supabase
                                .from('lead_appointments')
                                .update({ status: 'completed', call_outcome: 'missed' })
                                .eq('id', appt.id)
                        }
                    }
                }

                await supabase.from('outbox_jobs').update({ status: 'done', updated_at: new Date().toISOString() }).eq('id', job.id)
                processed++
            } catch (e: any) {
                // backoff retry
                const attempts = (job.attempts || 0) + 1
                const next = new Date(Date.now() + Math.min(60_000 * attempts, 15 * 60_000)).toISOString()
                await supabase
                    .from('outbox_jobs')
                    .update({ status: 'retrying', attempts, next_run_at: next, last_error: String(e?.message || e) })
                    .eq('id', job.id)
            }
        }

        return NextResponse.json({ processed })
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}


