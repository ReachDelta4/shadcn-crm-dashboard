import { NextRequest, NextResponse } from 'next/server'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scope = await getUserAndScope()
    if (!scope?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id: leadId } = await params

    const repo = new LeadStatusTransitionsRepository()
    const transitions = await repo.findByLeadId(leadId, 50)
    const match = transitions.find(t => (t.status_to === 'won' || t.status_to === 'invoice_sent') && (t.metadata as any)?.invoice?.line_items?.length)

    if (!match) return NextResponse.json({ data: null }, { status: 200 })

    const invoice = (match.metadata as any).invoice || {}
    const line_items = Array.isArray(invoice.line_items) ? invoice.line_items : []

    // Only return minimal fields needed to prefill UI
    const minimal = line_items.map((li: any) => ({
      product_id: li.product_id || null,
      quantity: li.quantity || 1,
      discount_type: li.discount_type || null,
      discount_value: typeof li.discount_value === 'number' ? li.discount_value : null,
      payment_plan_id: li.payment_plan_id || null,
    }))

    return NextResponse.json({ data: { line_items: minimal, status_to: match.status_to } })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


