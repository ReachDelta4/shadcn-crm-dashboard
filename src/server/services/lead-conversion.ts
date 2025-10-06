import type { SupabaseClient } from '@supabase/supabase-js'

export async function convertLeadToCustomerService(
	supabase: SupabaseClient,
	leadId: string,
	ownerId: string,
) {
	const { data: { user } } = await supabase.auth.getUser()
	if (!user || user.id !== ownerId) throw new Error('Unauthorized')

    const { data: customerId, error: rpcErr } = await (supabase as any)
        .rpc('convert_lead_to_customer_v2', { lead_id: leadId, initial_status: 'pending' })
	if (rpcErr) throw new Error(rpcErr.message || 'Conversion failed')

	const { data: lead, error: leadErr } = await supabase
		.from('leads')
		.select('*')
		.eq('id', leadId)
		.eq('owner_id', ownerId)
		.single()
	if (leadErr) throw new Error('Lead fetch failed after conversion')

	return { customerId, lead }
}


