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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await getClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { id } = await params
        if (!/^[0-9a-fA-F-]{36}$/.test(id)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        // Verify ownership of customer
        const { data: customer, error: custErr } = await (supabase as any)
            .from('customers')
            .select('id, owner_id, status')
            .eq('id', id)
            .eq('owner_id', user.id)
            .single()
        if (custErr || !customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        // Mark customer active
        await (supabase as any)
            .from('customers')
            .update({ status: 'active' })
            .eq('id', id)
            .eq('owner_id', user.id)

        // Find pending invoices for this customer and mark them paid
        const { data: pendingInvoices } = await (supabase as any)
            .from('invoices')
            .select('id')
            .eq('owner_id', user.id)
            .eq('customer_id', id)
            .eq('status', 'pending')

        const nowIso = new Date().toISOString()
        const invoiceIds = (pendingInvoices || []).map((r: any) => r.id)
        if (invoiceIds.length > 0) {
            // Mark payment schedules paid
            await (supabase as any)
                .from('invoice_payment_schedules')
                .update({ status: 'paid', paid_at: nowIso })
                .in('invoice_id', invoiceIds)
                .neq('status', 'paid')
            // Mark invoices paid
            await (supabase as any)
                .from('invoices')
                .update({ status: 'paid', paid_at: nowIso })
                .in('id', invoiceIds)
                .eq('owner_id', user.id)
        }

        return NextResponse.json({ success: true, invoices_marked_paid: invoiceIds.length })
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 })
    }
}


