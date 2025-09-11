import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function validateEnv() {
  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!anon) throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

let _client: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (_client) return _client
  validateEnv()
  _client = createBrowserClient(url as string, anon as string)
  return _client
}
