"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/shared/date-picker";
import { toast } from "sonner";
import { ProductPicker, type Product } from "@/features/dashboard/components/product-picker";
import { PaymentPlanPicker, type PaymentPlan } from "@/features/dashboard/components/payment-plan-picker";
import type { LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import {
  APPOINTMENT_TARGET_STATUS,
  MODE_TARGET_STATUS,
} from "@/features/leads/status-utils";

type Mode = 'demo_appointment' | 'invoice_sent' | 'won'
type TransitionMode = Exclude<Mode, 'demo_appointment'>

interface Props {
  leadId: string
  leadName?: string
  mode: Mode | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function getTimeZoneOffsetMinutes(dateUtc: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const parts = dtf.formatToParts(dateUtc)
  const map: Record<string,string> = {}
  parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value })
  const asInTz = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second))
  const asUtc = Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), dateUtc.getUTCDate(), dateUtc.getUTCHours(), dateUtc.getUTCMinutes(), dateUtc.getUTCSeconds())
  return Math.round((asInTz - asUtc) / 60000)
}

function computeUtcRange(dateLocal: Date, timeHHMM: string, durationMinutes: number, tz: string): { startUtc: string; endUtc: string } {
  const [hh, mm] = timeHHMM.split(':').map(n => Number(n || 0))
  const naiveUtc = new Date(Date.UTC(dateLocal.getFullYear(), dateLocal.getMonth(), dateLocal.getDate(), hh, mm, 0, 0))
  const offsetMin = getTimeZoneOffsetMinutes(naiveUtc, tz)
  const startMs = naiveUtc.getTime() - offsetMin * 60000
  const endMs = startMs + durationMinutes * 60000
  return { startUtc: new Date(startMs).toISOString(), endUtc: new Date(endMs).toISOString() }
}

export function LeadTransitionDialog({ leadId, leadName, mode, open, onOpenChange, onSuccess }: Props) {
  const [schedDate, setSchedDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState<string>("")
  const [durationMin, setDurationMin] = useState<string>("30")
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Invoice/Won form state
  const [product, setProduct] = useState<Product | null>(null)
  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [discountType, setDiscountType] = useState<'percent'|'amount'|'none'>('none')
  const [discountValueDisplay, setDiscountValueDisplay] = useState<string>("")
  const [plan, setPlan] = useState<PaymentPlan | null>(null)
  const [planId, setPlanId] = useState<string | null>(null)

  const isAppointment = mode === 'demo_appointment'
  const isInvoice = mode === 'invoice_sent' || mode === 'won'

  async function extractErrorMessage(res: Response): Promise<string> {
    try {
      const data = await res.json()
      return data?.error || data?.message || res.statusText || 'Request failed'
    } catch {
      try {
        return await res.text()
      } catch {
        return res.statusText || 'Request failed'
      }
    }
  }

  async function transitionLeadStrict(target: LeadStatus) {
    const res = await fetch(`/api/leads/${leadId}/transition`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_status: target }),
    })
    if (!res.ok) {
      if (res.status === 409) return // already transitioned
      throw new Error(await extractErrorMessage(res))
    }
  }

  async function transitionLeadLenient(target: LeadStatus, warning: string) {
    try {
      await transitionLeadStrict(target)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error || '')
      toast.warning(msg ? `${warning}: ${msg}` : warning)
    }
  }

  // Simple live preview for a single line
  const preview = (() => {
    if (!product) return null
    const qty = Math.max(1, Number(quantity) || 1)
    const subtotal = product.price_minor * qty

    let discountMinor = 0
    if (discountType !== 'none' && discountValueDisplay) {
      const num = Number(discountValueDisplay) || 0
      if (discountType === 'percent') {
        const bp = Math.max(0, Math.round(num * 100))
        discountMinor = Math.floor((subtotal * bp) / 10000)
      } else {
        discountMinor = Math.max(0, Math.round(num * 100))
      }
    }

    const afterDiscount = Math.max(0, subtotal - discountMinor)
    const taxBp = (product as any).tax_rate_bp || 0
    const taxMinor = Math.floor((afterDiscount * taxBp) / 10000)
    const totalMinor = afterDiscount + taxMinor

    return {
      currency: product.currency,
      subtotal,
      discount: discountMinor,
      tax: taxMinor,
      total: totalMinor,
    }
  })()

  function fmtCurrency(minor: number, currency: string) {
    return (minor / 100).toLocaleString(undefined, { style: 'currency', currency })
  }

  // Prefill from last sale metadata when modal opens for won/invoice
  useEffect(() => {
    let cancelled = false
    async function loadPrefill() {
      if (!open || !isInvoice) return
      try {
        const res = await fetch(`/api/leads/${leadId}/last-sale`)
        if (!res.ok) return
        const data = await res.json()
        const item = data?.data?.line_items?.[0]
        if (!cancelled && item) {
          setProductId(item.product_id || '')
          setQuantity(String(item.quantity || 1))
          if (item.payment_plan_id) setPlanId(item.payment_plan_id)
          if (item.discount_type) {
            setDiscountType(item.discount_type)
            // convert API units back to display: percent bp->percent, amount minor->major
            if (typeof item.discount_value === 'number') {
              if (item.discount_type === 'percent') {
                setDiscountValueDisplay(String(item.discount_value / 100))
              } else {
                setDiscountValueDisplay(String(item.discount_value / 100))
              }
            }
          } else {
            setDiscountType('none')
            setDiscountValueDisplay('')
          }
        }
      } catch {}
    }
    loadPrefill()
    return () => { cancelled = true }
  }, [open, isInvoice, leadId])

  async function submit() {
    try {
      if (!mode) return
      if (isAppointment) {
        if (!schedDate || !startTime || !durationMin) { toast.error('Select date/time'); return }
        const durationNumber = Number(durationMin)
        if (!Number.isFinite(durationNumber) || durationNumber <= 0) { toast.error('Invalid duration'); return }
        const { startUtc, endUtc } = computeUtcRange(schedDate, startTime, durationNumber, timezone)
        const appointmentRes = await fetch(`/api/leads/${leadId}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'none',
            start_at_utc: startUtc,
            end_at_utc: endUtc,
            timezone,
          }),
        })
        if (!appointmentRes.ok) throw new Error(await extractErrorMessage(appointmentRes))
        await transitionLeadLenient(APPOINTMENT_TARGET_STATUS, 'Appointment saved, but lead status update failed')
        window.dispatchEvent(new Event('calendar:changed'))
      } else if (isInvoice) {
        const targetStatus = MODE_TARGET_STATUS[mode as TransitionMode]
        if (!productId) { toast.error('Select a product'); return }
        const qty = Math.max(1, Number(quantity) || 1)

        let discount_type: 'percent' | 'amount' | undefined
        let discount_value: number | undefined
        if (discountType !== 'none' && discountValueDisplay) {
          discount_type = discountType
          if (discountType === 'percent') {
            discount_value = Math.max(0, Math.round(Number(discountValueDisplay) * 100))
          } else {
            discount_value = Math.max(0, Math.round(Number(discountValueDisplay) * 100))
          }
        }

        const lineTotalMinor = preview ? preview.total : undefined
        const unitPriceMinor = product ? product.price_minor : undefined
        const currency = product ? product.currency : undefined
        const taxRateBp = product ? (product as any).tax_rate_bp : undefined
        const idempotency_key = `${leadId}:${mode}:${productId}:${qty}:${discount_type || 'none'}:${discount_value || 0}`

        const payload: any = {
          target_status: targetStatus,
          idempotency_key,
          invoice: {
            line_items: [
              {
                product_id: productId,
                quantity: qty,
                ...(discount_type ? { discount_type, discount_value } : {}),
                ...(planId ? { payment_plan_id: planId } : {}),
                ...(typeof unitPriceMinor === 'number' ? { unit_price_minor: unitPriceMinor } : {}),
                ...(typeof taxRateBp === 'number' ? { tax_rate_bp: taxRateBp } : {}),
                ...(currency ? { currency } : {}),
                ...(typeof lineTotalMinor === 'number' ? { total_minor: lineTotalMinor } : {}),
              }
            ]
          }
        }
        const res = await fetch(`/api/leads/${leadId}/transition`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
        if (!res.ok) {
          let msg = 'Transition failed'
          try {
            const err = await res.json()
            msg = err?.error || msg
          } catch {
            try { msg = await res.text() } catch {}
          }
          throw new Error(msg)
        }
      }
      toast.success('Transition completed')
      onOpenChange(false)
      onSuccess?.()
      window.dispatchEvent(new Event('leads:changed'))
      window.dispatchEvent(new Event('calendar:changed'))
    } catch (e) {
      toast.error('Transition failed')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'demo_appointment' ? 'Schedule Demo/Appointment' : mode === 'invoice_sent' ? 'Create & Send Invoice' : 'Mark as Won'}</DialogTitle>
        </DialogHeader>
        {isAppointment && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-sm">Date</div>
              <DatePicker date={schedDate} setDate={setSchedDate} />
            </div>
            <div>
              <div className="text-sm">Start Time</div>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <div className="text-sm">Duration</div>
              <Select value={durationMin} onValueChange={(v: any) => setDurationMin(v)}>
                <SelectTrigger><SelectValue placeholder="Select duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm">Timezone</div>
              <Input value={timezone} onChange={(e)=>setTimezone(e.target.value)} />
            </div>
          </div>
        )}
        {isInvoice && (
          <div className="grid gap-3">
            <div>
              <div className="text-sm">Product</div>
              <ProductPicker
                value={productId}
                onValueChange={(id, p) => { setProductId(id); setProduct(p) }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="text-sm">Quantity</div>
                <Input type="number" min={1} value={quantity} onChange={(e)=>setQuantity(e.target.value)} />
              </div>
              <div>
                <div className="text-sm">Payment plan (optional)</div>
                <PaymentPlanPicker
                  productId={productId || null}
                  value={planId || undefined}
                  onValueChange={(id, p) => { setPlanId(id); setPlan(p) }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={discountType} onValueChange={(v:any)=>setDiscountType(v)}>
                <SelectTrigger><SelectValue placeholder="Discount type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No discount</SelectItem>
                  <SelectItem value="percent">Percent</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min={0}
                value={discountValueDisplay}
                onChange={(e)=>setDiscountValueDisplay(e.target.value)}
                placeholder={discountType === 'percent' ? 'e.g. 10 for 10%' : 'e.g. 25 for $25.00'}
                disabled={discountType === 'none'}
              />
            </div>

            {!!preview && (
              <div className="rounded-md border p-3 text-sm grid grid-cols-2 gap-2">
                <div>Subtotal</div><div className="text-right">{fmtCurrency(preview.subtotal, preview.currency)}</div>
                <div>Discount</div><div className="text-right">- {fmtCurrency(preview.discount, preview.currency)}</div>
                <div>Tax</div><div className="text-right">{fmtCurrency(preview.tax, preview.currency)}</div>
                <div className="font-medium">Total</div><div className="text-right font-medium">{fmtCurrency(preview.total, preview.currency)}</div>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
