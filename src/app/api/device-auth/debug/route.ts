export const runtime = 'nodejs'

import { supabaseAdmin } from '@/server/supabase'

export async function GET() {
  try {
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
