export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/server/supabase'
import { decrypt } from '@/server/crypto'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 30
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

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: 'Service role not configured' }, { status: 500 })

    const body = await request.json().catch(() => ({})) as any
    const code = typeof body?.code === 'string' ? body.code : ''
    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    try { rateLimit(code); if (ip) rateLimit(`ip:${ip}`) } catch { return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 }) }

    // Atomic single-use: update used_at only if not used and not expired, returning row
    const { data, error } = await supabaseAdmin
      .rpc('device_auth_consume_code', { p_code: code })

    if (error) {
      console.error('exchange consume_code error:', error)
      return NextResponse.json({ error: 'Exchange failed' }, { status: 400 })
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

    const access_token = decrypt(row.access_token_enc)
    const refresh_token = decrypt(row.refresh_token_enc)

    return NextResponse.json({ access_token, refresh_token }, { status: 200 })
  } catch (e) {
    console.error('device-auth/exchange error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
