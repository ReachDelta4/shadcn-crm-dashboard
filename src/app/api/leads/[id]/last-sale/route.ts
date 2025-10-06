import { NextRequest, NextResponse } from 'next/server'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
// Prefill disabled: use invoices directly in future if needed

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scope = await getUserAndScope()
    if (!scope?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: leadId } = await params

    return NextResponse.json({ data: null }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


