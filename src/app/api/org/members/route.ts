import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/server/supabase'
import { fetchOrgScope, ensureLicenseActive, ensureOrgAdmin } from '@/server/org/context'

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
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
				},
			},
		}
	)
}

function requireServiceClient() {
	if (!supabaseAdmin) {
		throw new Error('Supabase service role not configured')
	}
	return supabaseAdmin
}

const allowedRoles = ['sales_rep', 'supervisor', 'manager', 'director', 'org_admin']
const allowedStatuses = ['active', 'invited', 'disabled']

export async function GET() {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		let scope
		try {
			scope = await fetchOrgScope(supabase as any, user.id)
			ensureLicenseActive(scope)
		} catch (error: any) {
			const status = Number(error?.statusCode || 0)
			if (status === 402 || status === 403) {
				return NextResponse.json({ error: error.message }, { status })
			}
			throw error
		}

		if (!scope.orgId) {
			return NextResponse.json({ error: 'Organization not configured' }, { status: 400 })
		}

		const admin = requireServiceClient()
		const { data: members, error: listError } = await admin
			.from('organization_members')
			.select('id, org_id, user_id, role, status, team_id, created_at, updated_at')
			.eq('org_id', scope.orgId)
			.order('created_at', { ascending: true })
		if (listError) throw listError

		const { data: orgRow, error: orgError } = await admin
			.from('organizations')
			.select('seat_limit_reps, license_expires_at')
			.eq('id', scope.orgId)
			.single()
		if (orgError) throw orgError

		const activeReps = (members || []).filter(
			m => m.role === 'sales_rep' && m.status === 'active'
		).length

		return NextResponse.json({
			members: members || [],
			activeReps,
			seatLimitReps: orgRow?.seat_limit_reps ?? null,
			licenseExpiresAt: orgRow?.license_expires_at || null
		})
	} catch (error) {
		console.error('Org members GET failed:', error)
		return NextResponse.json({ error: 'Failed to fetch organization members' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		let scope
		try {
			scope = await fetchOrgScope(supabase as any, user.id)
			ensureLicenseActive(scope)
			ensureOrgAdmin(scope)
		} catch (error: any) {
			const status = Number(error?.statusCode || 0)
			if (status === 402 || status === 403) {
				return NextResponse.json({ error: error.message }, { status })
			}
			return NextResponse.json({ error: error.message || 'Forbidden' }, { status: status || 403 })
		}

		const { userId, role, status = 'active' } = await request.json()
		if (!userId || typeof userId !== 'string') {
			return NextResponse.json({ error: 'userId is required' }, { status: 400 })
		}
		if (!allowedRoles.includes(role)) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
		}
		if (!allowedStatuses.includes(status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}

		const admin = requireServiceClient()
		const { data, error } = await admin.rpc('create_org_member', {
			p_org_id: scope.orgId,
			p_user_id: userId,
			p_role: role,
			p_status: status
		})
		if (error) {
			const message = String(error.message || '')
			if (/seat_limit_reached/i.test(message)) {
				return NextResponse.json({ error: 'Seat limit reached' }, { status: 409 })
			}
			return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
		}

		const member = Array.isArray(data) ? data[0] : data
		return NextResponse.json({ member }, { status: 201 })
	} catch (error) {
		console.error('Org members POST failed:', error)
		return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		let scope
		try {
			scope = await fetchOrgScope(supabase as any, user.id)
			ensureLicenseActive(scope)
			ensureOrgAdmin(scope)
		} catch (error: any) {
			const status = Number(error?.statusCode || 0)
			if (status === 402 || status === 403) {
				return NextResponse.json({ error: error.message }, { status })
			}
			return NextResponse.json({ error: error.message || 'Forbidden' }, { status: status || 403 })
		}

		const { memberId, status } = await request.json()
		if (!memberId) {
			return NextResponse.json({ error: 'memberId is required' }, { status: 400 })
		}
		if (!allowedStatuses.includes(status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}

		const admin = requireServiceClient()
		const { data, error } = await admin
			.from('organization_members')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', memberId)
			.eq('org_id', scope.orgId)
			.select('id, org_id, user_id, role, status, team_id, created_at, updated_at')
			.single()
		if (error) {
			return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
		}

		return NextResponse.json({ member: data })
	} catch (error) {
		console.error('Org members PATCH failed:', error)
		return NextResponse.json({ error: 'Failed to update member' }, { status: 500 })
	}
}
