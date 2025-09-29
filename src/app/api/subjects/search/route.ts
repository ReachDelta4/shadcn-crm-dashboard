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
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) =>
							cookieStore.set(name, value, options)
						)
					} catch {
						// The `setAll` method was called from a Server Component.
						// This can be ignored if you have middleware refreshing
						// user sessions.
					}
				},
			},
		}
	)
}

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const { searchParams } = new URL(request.url)
		const query = searchParams.get('q') || ''
		const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

		// Search leads and customers by subject_id, with text search on name/company
		const { data: leads, error: leadsError } = await supabase
			.from('leads')
			.select('subject_id, full_name, company, status, email, created_at')
			.eq('owner_id', user.id)
			.or(`full_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
			.not('subject_id', 'is', null) // only include leads with subject_id (backfilled)
			.order('created_at', { ascending: false })
			.limit(Math.ceil(limit / 2))

		if (leadsError) {
			console.error('Leads search error:', leadsError)
			return NextResponse.json({ error: 'Failed to search leads' }, { status: 500 })
		}

		const { data: customers, error: customersError } = await supabase
			.from('customers')
			.select('subject_id, full_name, company, status, email, created_at')
			.eq('owner_id', user.id)
			.or(`full_name.ilike.%${query}%,company.ilike.%${query}%,email.ilike.%${query}%`)
			.not('subject_id', 'is', null) // only include customers with subject_id (backfilled)
			.order('created_at', { ascending: false })
			.limit(Math.ceil(limit / 2))

		if (customersError) {
			console.error('Customers search error:', customersError)
			return NextResponse.json({ error: 'Failed to search customers' }, { status: 500 })
		}

		// Combine and format results
		const subjects = [
			...(leads || []).map(lead => ({
				subject_id: lead.subject_id,
				type: 'lead' as const,
				name: lead.full_name,
				company: lead.company,
				status: lead.status,
				email: lead.email,
				created_at: lead.created_at
			})),
			...(customers || []).map(customer => ({
				subject_id: customer.subject_id,
				type: 'customer' as const,
				name: customer.full_name,
				company: customer.company,
				status: customer.status,
				email: customer.email,
				created_at: customer.created_at
			}))
		]

		// Sort by created_at descending and limit
		subjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		const limitedSubjects = subjects.slice(0, limit)

		return NextResponse.json({
			subjects: limitedSubjects,
			total: limitedSubjects.length
		})

	} catch (error) {
		console.error('Subject search error:', error)
		return NextResponse.json({ error: 'Failed to search subjects' }, { status: 500 })
	}
}
