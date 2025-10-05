"use client";

import { useState } from "react";
import { Lead } from "@/features/dashboard/pages/leads/types/lead";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Props { lead: Lead; onChanged?: () => void }

type TargetStatus = 'new'|'contacted'|'qualified'|'demo_appointment'|'proposal_negotiation'|'invoice_sent'|'won'|'lost'

export function LeadStatusDropdown({ lead, onChanged }: Props) {
	const [target, setTarget] = useState<TargetStatus>(lead.status as any)
	const [openAppt, setOpenAppt] = useState(false)
	const [openInvoice, setOpenInvoice] = useState(false)

	// Appointment modal state
	const [startAt, setStartAt] = useState("")
	const [endAt, setEndAt] = useState("")
	const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)

	// Invoice modal state (minimal for v1)
	const [productId, setProductId] = useState("")
	const [quantity, setQuantity] = useState("1")

	async function submitTransition(payload: any) {
		const res = await fetch(`/api/leads/${lead.id}/transition`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
		})
		if (!res.ok) throw new Error(await res.text())
		onChanged?.()
	}

	async function handleChange(next: TargetStatus) {
		setTarget(next)
		try {
			if (next === 'demo_appointment') {
				setOpenAppt(true)
				return
			}
			if (next === 'invoice_sent') {
				setOpenInvoice(true)
				return
			}
			await submitTransition({ target_status: next })
			toast.success(`Lead moved to ${next}`)
		} catch {
			toast.error('Failed to update status')
		}
	}

	async function confirmAppointment() {
		try {
			await submitTransition({
				target_status: 'demo_appointment',
				appointment: { provider: 'none', start_at_utc: new Date(startAt).toISOString(), end_at_utc: new Date(endAt).toISOString(), timezone }
			})
			setOpenAppt(false)
			toast.success('Appointment created')
			window.dispatchEvent(new Event('calendar:changed'))
			window.dispatchEvent(new Event('leads:changed'))
		} catch {
			toast.error('Failed to create appointment')
		}
	}

	async function confirmInvoice() {
		try {
			if (!productId) { toast.error('Select a product'); return }
			await submitTransition({
				target_status: 'invoice_sent',
				invoice: { line_items: [{ product_id: productId, quantity: Number(quantity) }] }
			})
			setOpenInvoice(false)
			toast.success('Invoice created and marked sent')
		} catch {
			toast.error('Failed to create invoice')
		}
	}

	return (
		<div className="flex items-center gap-2">
			<Select value={target} onValueChange={(v:any) => handleChange(v)}>
				<SelectTrigger className="w-[220px]">
					<SelectValue placeholder="Change status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="new">New</SelectItem>
					<SelectItem value="contacted">Contacted</SelectItem>
					<SelectItem value="qualified">Qualified</SelectItem>
					<SelectItem value="demo_appointment">Demo/Appointment</SelectItem>
					<SelectItem value="proposal_negotiation">Proposal/Negotiation</SelectItem>
					<SelectItem value="invoice_sent">Invoice Sent</SelectItem>
					<SelectItem value="won">Won</SelectItem>
					<SelectItem value="lost">Lost</SelectItem>
				</SelectContent>
			</Select>

			{/* Appointment Modal */}
			<Dialog open={openAppt} onOpenChange={setOpenAppt}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Schedule Demo/Appointment</DialogTitle>
					</DialogHeader>
					<div className="grid gap-3">
						<div className="grid gap-1">
							<Label>Start</Label>
							<Input type="datetime-local" value={startAt} onChange={e=>setStartAt(e.target.value)} />
						</div>
						<div className="grid gap-1">
							<Label>End</Label>
							<Input type="datetime-local" value={endAt} onChange={e=>setEndAt(e.target.value)} />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={()=>setOpenAppt(false)}>Cancel</Button>
						<Button onClick={confirmAppointment}>Confirm</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Invoice Modal (minimal) */}
			<Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Invoice for Lead</DialogTitle>
					</DialogHeader>
					<div className="grid gap-3">
						<div className="grid gap-1">
							<Label>Product ID</Label>
							<Input value={productId} onChange={e=>setProductId(e.target.value)} placeholder="UUID" />
						</div>
						<div className="grid gap-1">
							<Label>Quantity</Label>
							<Input type="number" min={1} value={quantity} onChange={e=>setQuantity(e.target.value)} />
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={()=>setOpenInvoice(false)}>Cancel</Button>
						<Button onClick={confirmInvoice}>Create</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}


