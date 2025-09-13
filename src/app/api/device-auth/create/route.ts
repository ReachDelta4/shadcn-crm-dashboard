export const runtime = 'nodejs'

import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/server/supabase'
import { encrypt } from '@/server/crypto'
import crypto from 'crypto'

const TTL_SECONDS = 60
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

const memoryRateLimiter = new Map<string, { count: number; resetAt: number }>()

function rateLimit(key: string) {
  const now = Date.now()
  const entry = memoryRateLimiter.get(key)
  if (!entry || now > entry.resetAt) {
    memoryRateLimiter.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }
  entry.count += 1
  if (entry.count > RATE_LIMIT_MAX) throw new Error('Rate limited')
}

export async function POST() {
  try {
    console.log('=== DEVICE AUTH CREATE START ===')
    console.log('ENV CHECK:')
    console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.log('- SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING') 
    console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
    console.log('- DEVICE_CODE_ENC_KEY:', process.env.DEVICE_CODE_ENC_KEY ? 'SET' : 'MISSING')
    console.log('- supabaseAdmin:', supabaseAdmin ? 'INITIALIZED' : 'NULL')

    if (!supabaseAdmin) {
      console.log('ERROR: supabaseAdmin is null - service role not configured')
      return new Response('Service role not configured', { status: 500 })
    }

    console.log('Getting cookies and headers...')
    const cookieStore = await cookies()
    const hdrs = await headers()
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    console.log('Creating server client...')
    const supabase = createServerClient(url, anon, {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set(name, value, options) },
        remove(name: string, options: any) { cookieStore.set(name, '', { ...options, maxAge: 0 }) },
      }
    })

    console.log('Getting user from session...')
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.log('Auth error:', error)
      return new Response('Unauthorized', { status: 401 })
    }
    if (!user) {
      console.log('No user in session')
      return new Response('Unauthorized', { status: 401 })
    }
    console.log('User found:', user.id)

    // Rate limit by user id and IP
    const ip = (hdrs.get('x-forwarded-for') || '').split(',')[0].trim()
    const ua = hdrs.get('user-agent') || ''
    console.log('Rate limiting for user:', user.id, 'IP:', ip)
    try { 
      rateLimit(user.id); 
      if (ip) rateLimit(`ip:${ip}`) 
    } catch { 
      console.log('Rate limited')
      return new Response('Too Many Requests', { status: 429 }) 
    }

    // Get current session tokens from cookies
    console.log('Getting session tokens...')
    const { data: sessionData } = await supabase.auth.getSession()
    const tokens = sessionData?.session
    if (!tokens?.access_token || !tokens?.refresh_token) {
      console.log('No tokens in session')
      return new Response('No session', { status: 400 })
    }
    console.log('Tokens found')

    console.log('Generating code and encrypting tokens...')
    const code = cryptoRandom()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + TTL_SECONDS * 1000)

    try {
      const accessTokenEnc = encrypt(tokens.access_token)
      const refreshTokenEnc = encrypt(tokens.refresh_token)
      console.log('Encryption successful')

      console.log('Upserting to database...')
      const { error: upsertError } = await supabaseAdmin.from('device_auth_codes').upsert({
        code,
        user_id: user.id,
        access_token_enc: accessTokenEnc,
        refresh_token_enc: refreshTokenEnc,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        client_ip: ip,
        user_agent: ua
      }, { onConflict: 'code' })
      
      if (upsertError) {
        console.log('Database upsert error:', upsertError)
        return new Response('Create failed', { status: 500 })
      }
      console.log('Database upsert successful')

      console.log('=== CREATE ROUTE SUCCESS ===')
      return new Response(JSON.stringify({ code, expires_in: TTL_SECONDS }), { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      })
    } catch (encError) {
      console.log('Encryption or database error:', encError)
      throw encError
    }
  } catch (e) {
    console.error('device-auth/create error:', e)
    return new Response('Server error', { status: 500 })
  }
}

function cryptoRandom(): string {
  const buf = crypto.randomBytes(20)
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
