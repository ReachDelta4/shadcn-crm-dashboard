export const runtime = 'nodejs'

import { supabaseAdmin, supabaseServer } from '@/server/supabase'
import { flags } from '@/server/config/flags'

export async function GET() {
	try {
		// Production hardening: only allow in non-production or for God users
		if (flags.isProduction) {
			// Attempt to identify user; if not God, deny
			try {
				const { data: { user } } = await supabaseServer.auth.getUser()
				const isGod = !!user && flags.godUserIds.includes(user.id)
				if (!isGod) {
					return new Response('Not Found', { status: 404 })
				}
			} catch {
				return new Response('Not Found', { status: 404 })
			}
		}

		console.log('=== DEBUG ROUTE START ===')
		console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
		console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
		console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
		console.log('DEVICE_CODE_ENC_KEY:', process.env.DEVICE_CODE_ENC_KEY ? 'SET' : 'MISSING')
		console.log('supabaseAdmin:', supabaseAdmin ? 'INITIALIZED' : 'NULL')
		
		if (!supabaseAdmin) {
			return new Response(JSON.stringify({ error: 'supabaseAdmin is null' }), { status: 500 })
		}

		// Test table access
		const { data, error } = await supabaseAdmin
			.from('device_auth_codes')
			.select('code')
			.limit(1)
		
		console.log('Table test result:', { data, error })
		
		return new Response(JSON.stringify({ 
			status: 'ok', 
			envVars: {
				supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
				anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
				serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
				encKey: !!process.env.DEVICE_CODE_ENC_KEY
			},
			supabaseAdmin: !!supabaseAdmin,
			tableAccess: { data, error }
		}), { 
			status: 200, 
			headers: { 'Content-Type': 'application/json' } 
		})
	} catch (e) {
		console.error('Debug route error:', e)
		const message = e instanceof Error ? e.message : 'Internal server error'
		return new Response(JSON.stringify({ error: message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
	}
}
