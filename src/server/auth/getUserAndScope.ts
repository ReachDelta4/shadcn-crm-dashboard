import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { flags } from '@/server/config/flags'

export type UserRole = 'rep' | 'lead' | 'manager' | 'executive' | 'god'

export type UserScope = {
    userId: string
    role: UserRole
    teamId: string | null
    orgId: string | null
    // Empty array => no owner filter (god scope). Non-empty => restrict to these owners.
    allowedOwnerIds: string[]
}

export async function getUserAndScope(): Promise<UserScope> {
	const cookieStore = await cookies()
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() { return cookieStore.getAll() },
				setAll() { /* no-op for server resolver */ },
			},
		}
	)
	const { data: { user } } = await supabase.auth.getUser()
	if (!user) throw new Error('Unauthorized')

    // God via env flag list
    if (flags.godUserIds.includes(user.id)) {
        // For god users, use empty array to signal no owner filter (repos interpret [] as no filter)
        return { userId: user.id, role: 'god', teamId: null, orgId: null, allowedOwnerIds: [] }
    }

	// Fetch user role row if present
	const { data: roleRow } = await supabase
		.from('user_roles')
		.select('org_id, team_id, role')
		.eq('user_id', user.id)
		.maybeSingle()

	const role: UserRole = (roleRow?.role as UserRole) || 'rep'
	const teamId = roleRow?.team_id || null
	const orgId = roleRow?.org_id || null

	// Determine scope (KISS default)
    let allowedOwnerIds: string[]
	switch (role) {
		case 'rep':
			allowedOwnerIds = [user.id]
			break
		case 'lead':
			// For now, team scope needs a team membership table; until then, default to own only
			allowedOwnerIds = [user.id]
			break
		case 'manager':
		case 'executive':
			// Until org membership is modeled, default to own only; widen later in Phase 1 extensions
			allowedOwnerIds = [user.id]
			break
        case 'god':
            // No owner filter
            allowedOwnerIds = []
            break
	}

	return { userId: user.id, role, teamId, orgId, allowedOwnerIds }
}
