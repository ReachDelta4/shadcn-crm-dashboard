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

export async function GET(_req: NextRequest) {
	try {
		const supabase = await getClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ items: [] }, { status: 401 })
		const { data, error } = await (supabase as any)
			.from('recurring_revenue_schedules')
			.select('id, invoice_line_id, cycle_num, billing_at_utc, amount_minor, status, invoice_lines!inner(invoice_id), invoices!invoice_lines_invoice_id_fkey!inner(owner_id)')
			.eq('invoices.owner_id', user.id)
			.in('status', ['scheduled','billed','cancelled'])
		if (error) throw error
		return NextResponse.json({ items: (data || []).map((d: any) => ({
			id: d.id,
			invoice_line_id: d.invoice_line_id,
			cycle_num: d.cycle_num,
			billing_at_utc: d.billing_at_utc,
			amount_minor: d.amount_minor,
			status: d.status,
		})) })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
  }
}
