import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { generateReportV3Tabs } from '@/server/services/report-v3-tabs'

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

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id } = await params
		const repo = new ReportsV3TabsRepository(supabase as any)
		const report = await repo.findBySessionId(id, user.id)
		if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return NextResponse.json(report)
	} catch (error) {
		console.error('Report V3 Tabs fetch error:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { id } = await params

		// Idempotency: if already running or ready, accept without enqueuing duplicate work
		const repo = new ReportsV3TabsRepository(supabase as any)
		const existing = await repo.findBySessionId(id, user.id)
		if (existing && (existing.status === 'running' || existing.status === 'ready')) {
			return NextResponse.json({ accepted: true, status: existing.status }, { status: 202 })
		}
		// Ensure a queued row exists (only if missing or not already queued)
		try {
			if (!existing || existing.status !== 'queued') {
				await repo.upsertQueued(id)
			}
		} catch (e) {
			console.error('Report V3 Tabs ensure queued failed (non-fatal):', e)
		}

		// Durable worker path via Supabase Edge Function (behind env flag)
		if (process.env.REPORT_V3_TABS_USE_EDGE === 'true') {
			try {
				const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
				const projectRef = new URL(projectUrl).hostname.split('.')[0]
				const fnUrl = `https://${projectRef}.supabase.co/functions/v1/report-v3-tabs`
				const auth = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
				await fetch(fnUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${auth}`,
					},
					body: JSON.stringify({ sessionId: id, userId: user.id })
				}).catch(() => {})
			} catch (e) {
				console.error('Report V3 Tabs edge invocation failed (non-fatal):', e)
			}
			return NextResponse.json({ accepted: true, via: 'edge' }, { status: 202 })
		}

		// Fire-and-forget background generation. Do not await to keep route fast.
		Promise.resolve().then(async () => {
			try {
				await generateReportV3Tabs(supabase as any, user.id, id)
			} catch (e) {
				console.error('Report V3 Tabs async generation error:', e)
			}
		}).catch(() => {})

		return NextResponse.json({ accepted: true }, { status: 202 })
	} catch (error) {
		console.error('Report V3 Tabs trigger error:', error)
		return NextResponse.json({ error: 'Failed to trigger tabs generation' }, { status: 500 })
	}
}



