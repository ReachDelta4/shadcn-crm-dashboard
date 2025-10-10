"use client";

import { useState, useTransition } from "react";
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
  phone: z.string().optional(),
  amount: z.coerce.number().min(0),
  status: z.enum(["pending","processing","completed","cancelled"]).default("pending"),
  lead_id: z.string().uuid().optional(),
});

interface NewOrderDialogProps {
  onCreated?: () => void;
}

export function NewOrderDialog({ onCreated }: NewOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<"pending"|"processing"|"completed"|"cancelled">("pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; email: string; phone?: string }>>([]);
  const [leadId, setLeadId] = useState<string | undefined>(undefined);

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads?pageSize=50');
      if (!res.ok) return;
      const data = await res.json();
      const list = (data?.data || []).map((l: any) => ({ id: l.id, full_name: l.full_name, email: l.email, phone: l.phone }));
      setLeads(list);
    } catch {}
  }

  function resetForm() {
    setCustomerName("");
    setEmail("");
    setPhone("");
    setAmount("");
    setStatus("pending");
    setError(null);
    setLeadId(undefined);
  }

  async function ensureLeadIdIfNeeded(): Promise<string | undefined> {
    // If a lead is selected, use it. Otherwise, create a new lead so order is always associated when "No lead" is chosen.
    if (leadId) return leadId;
    // Create a new lead based on entered fields
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

    // Validate base inputs first
    const parsed = schema.safeParse({
      customer_name: customerName.trim(),
      email: email.trim(),
      amount: amount === "" ? 0 : Number(amount),
      phone: phone.trim() || undefined,
      status,
      lead_id: leadId,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    // Guard: when linked to a lead, required fields must exist (e.g., email)
    if (leadId && !email.trim()) {
      setError('Linked lead is missing an email. Please edit the lead or unlink and create a new lead.');
      return;
    }

    startTransition(async () => {
      try {
        // Ensure we have a lead id when user selected "No lead"
        const finalLeadId = await ensureLeadIdIfNeeded();
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...parsed.data,
            lead_id: finalLeadId,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to create order");
        }
        onCreated?.();
        setOpen(false);
        resetForm();
      } catch (err: any) {
        setError(typeof err?.message === "string" ? err.message : "Failed to create order");
      }
    });
  }

  const isLinked = !!leadId;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) loadLeads(); else resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create new order</DialogTitle>
          <DialogDescription>Enter order details and save.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Link to Lead (Optional)</Label>
            <Select value={leadId || 'none'} onValueChange={(v: any) => {
              const newLeadId = v === 'none' ? undefined : v;
              setLeadId(newLeadId);
              const selected = leads.find(l => l.id === newLeadId);
              if (selected) {
                setCustomerName(selected.full_name || "");
                setEmail(selected.email || "");
                setPhone(selected.phone || "");
              } else {
                // Unlinked: keep current values editable
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
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
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













































