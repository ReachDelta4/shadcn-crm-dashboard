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
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) },
      },
    }
  )
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    // Verify subject exists and is owned by the user
    const { data: subj, error: subjErr } = await (supabase as any)
      .from('crm_subjects')
      .select('id')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
    if (subjErr || !subj) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Prefer customer over lead if both exist
    const { data: customer } = await (supabase as any)
      .from('customers')
      .select('subject_id, full_name, company, status')
      .eq('subject_id', id)
      .eq('owner_id', user.id)
      .limit(1)
      .maybeSingle()

    let type: 'customer' | 'lead' | null = null
    let name: string | null = null
    let company: string | null = null
    let status: string | null = null

    if (customer) {
      type = 'customer'
      name = customer.full_name || null
      company = customer.company || null
      status = customer.status || null
    } else {
      const { data: lead } = await (supabase as any)
        .from('leads')
        .select('subject_id, full_name, company, status')
        .eq('subject_id', id)
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (lead) {
        type = 'lead'
        name = lead.full_name || null
        company = lead.company || null
        status = lead.status || null
      }
    }

    const stage_label = type ? `${type.charAt(0).toUpperCase() + type.slice(1)}${status ? ' - ' + status : ''}` : null

    // Count sessions linked to this subject for this user
    const { count: callsCount } = await (supabase as any)
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('subject_id', id)
      .eq('user_id', user.id)

    return NextResponse.json({
      subject_id: id,
      type,
      status,
      name,
      company,
      stage_label,
      calls_count: callsCount || 0,
    })
  } catch (error) {
    console.error('[subjects:id] GET error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const runtime = 'nodejs'

