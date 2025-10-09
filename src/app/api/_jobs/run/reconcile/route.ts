import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getClient() {
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{ cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({name, value, options}) => cookieStore.set(name, value, options)) } }
	)
}

export async function POST(req: NextRequest) {
	try {
		const token = req.headers.get('authorization')?.replace(/Bearer\s+/i, '')
		if (!token || token !== process.env.JOB_RUNNER_TOKEN) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const supabase = await getClient()
		// reconcile: mark invoices paid if all schedules paid
		const { data: invoices, error } = await supabase
			.from('invoices')
			.select('id, status')
		if (error) throw error
		let updated = 0
		for (const inv of invoices || []) {
			const { count, error: cErr } = await supabase
				.from('invoice_payment_schedules')
				.select('*', { count: 'exact', head: true })
				.eq('invoice_id', inv.id)
				.neq('status', 'paid')
			if (cErr) continue
			if ((count || 0) === 0 && inv.status !== 'paid') {
				await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', inv.id)
				updated++
			}
		}
		return NextResponse.json({ updated })
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
	}
}



