"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const schema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Valid email is required"),
  status: z.enum(["draft","pending","paid","overdue","cancelled"]).default("draft"),
  lead_id: z.string().uuid().optional(),
  phone: z.string().optional(),
  line_items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
    discount_type: z.enum(["percent","amount"]).optional(),
    discount_value: z.coerce.number().int().min(0).optional(),
  })).min(1),
});

interface NewInvoiceDialogProps {
  onCreated?: () => void;
}

export function NewInvoiceDialog({ onCreated }: NewInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"draft"|"pending"|"paid"|"overdue"|"cancelled">("draft");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; email: string; phone?: string }>>([])
  const [leadId, setLeadId] = useState<string | undefined>(undefined)

  const [lineItems, setLineItems] = useState<Array<{ product_id: string; quantity: string; discount_type?: "percent"|"amount"; discount_value?: string }>>([
    { product_id: "", quantity: "1" },
  ])

  useEffect(() => { loadLeads() }, [])

  useEffect(() => {
    const refresh = () => { loadLeads() }
    window.addEventListener('leads:changed', refresh)
    window.addEventListener('leads:optimistic', refresh as any)
    return () => {
      window.removeEventListener('leads:changed', refresh)
      window.removeEventListener('leads:optimistic', refresh as any)
    }
  }, [])

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads?pageSize=50')
      if (!res.ok) return
      const data = await res.json()
      const list = (data?.data || [])
        .filter((l:any) => (l.status || 'new') !== 'converted')
        .map((l:any) => ({ id: l.id, full_name: l.full_name, email: l.email, phone: l.phone }))
      setLeads(list)
    } catch {}
  }

  function resetForm() {
    setCustomerName("");
    setEmail("");
    setStatus("draft");
    setLeadId(undefined)
    setLineItems([{ product_id: "", quantity: "1" }])
    setError(null);
    setPhone("")
  }

  function updateLine(idx: number, patch: Partial<{ product_id: string; quantity: string; discount_type?: "percent"|"amount"; discount_value?: string }>) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, ...patch } : li))
  }

  function addLine() { setLineItems(prev => [...prev, { product_id: "", quantity: "1" }]) }
  function removeLine(idx: number) { setLineItems(prev => prev.filter((_, i) => i !== idx)) }

  async function ensureLeadIdIfNeeded(): Promise<string | undefined> {
    if (leadId) return leadId;
    const payload = {
      full_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    };
    const create = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!create.ok) {
      const body = await create.json().catch(() => ({}));
      throw new Error(body?.error || 'Failed to create lead');
    }
    const lead = await create.json().catch(() => null) as any;
    return lead?.id as string | undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({
      customer_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      status,
      lead_id: leadId,
      line_items: lineItems.map(li => ({
        product_id: li.product_id,
        quantity: Number(li.quantity || 1),
        discount_type: li.discount_type,
        discount_value: li.discount_value ? Number(li.discount_value) : undefined,
      })),
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    if (leadId && !email.trim()) {
      setError('Linked lead is missing an email. Please edit the lead or unlink and create a new lead.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: parsed.data.customer_name,
            email: parsed.data.email,
            phone: parsed.data.phone,
            status: parsed.data.status,
            lead_id: await ensureLeadIdIfNeeded(),
            line_items: parsed.data.line_items,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to create invoice");
        }
        onCreated?.();
        setOpen(false);
        resetForm();
      } catch (err: any) {
        setError(typeof err?.message === "string" ? err.message : "Failed to create invoice");
      }
    });
  }

  const isLinked = !!leadId;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create new invoice</DialogTitle>
          <DialogDescription>Enter invoice details and save.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="customer_name">Customer name</Label>
              <Input id="customer_name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required readOnly={isLinked} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required readOnly={isLinked} />
            </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} readOnly={isLinked} />
          </div>
          </div>

          <div className="grid gap-2">
            <Label>Lead (optional)</Label>
            <Select value={leadId || 'none'} onValueChange={(v:any) => {
              const newLeadId = v === 'none' ? undefined : v
              setLeadId(newLeadId)
              const selected = leads.find(l => l.id === newLeadId)
              if (selected) {
                setCustomerName(selected.full_name || "")
                setEmail(selected.email || "")
                setPhone(selected.phone || "")
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select lead to link" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No lead</SelectItem>
                {leads.map(l => (
                  <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Line items</Label>
              <Button type="button" variant="outline" onClick={addLine}>Add line</Button>
            </div>
            {lineItems.map((li, idx) => (
              <div key={idx} className="grid gap-2 sm:grid-cols-5 sm:gap-4">
                <Input placeholder="Product ID (UUID)" value={li.product_id} onChange={e => updateLine(idx, { product_id: e.target.value })} />
                <Input placeholder="Qty" type="number" min={1} value={li.quantity} onChange={e => updateLine(idx, { quantity: e.target.value })} />
                <Select value={li.discount_type || 'none'} onValueChange={(v:any) => updateLine(idx, { discount_type: v === 'none' ? undefined : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No discount</SelectItem>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="amount">Amount</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Discount value" type="number" min={0} value={li.discount_value || ""} onChange={e => updateLine(idx, { discount_value: e.target.value })} />
                <Button type="button" variant="ghost" onClick={() => removeLine(idx)}>Remove</Button>
              </div>
            ))}
          </div>

          {error && <div className="text-sm text-red-600" role="alert">{error}</div>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}













































