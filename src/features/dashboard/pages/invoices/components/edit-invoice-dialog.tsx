"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Invoice, InvoiceStatus } from "../types/invoice";
import { toast } from "sonner";

interface EditInvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const STATUS_OPTIONS: InvoiceStatus[] = ["draft","sent","pending","paid","overdue","cancelled"];

export function EditInvoiceDialog({ invoice, open, onOpenChange, onSaved }: EditInvoiceDialogProps) {
  const [customerName, setCustomerName] = useState(invoice.customerName || "");
  const [email, setEmail] = useState(invoice.email || "");
  const [phone, setPhone] = useState(invoice.phone || "");
  const [status, setStatus] = useState<InvoiceStatus>(invoice.status);
  const [date, setDate] = useState(invoice.date || "");
  const [dueDate, setDueDate] = useState(invoice.dueDate || "");
  const [amount, setAmount] = useState(String(invoice.amount ?? 0));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; email: string; phone?: string }>>([]);
  const [leadId, setLeadId] = useState<string | undefined>(undefined);

  function toLocalDateTimeInput(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads?pageSize=50');
      if (!res.ok) return;
      const data = await res.json();
      const list = (data?.data || [])
        .filter((l: any) => (l.status || 'new') !== 'converted')
        .map((l: any) => ({ id: l.id, full_name: l.full_name, email: l.email, phone: l.phone }));
      setLeads(list);
    } catch {}
  }

  useEffect(() => {
    if (!open) return;
    // Initialize form fields
    setCustomerName(invoice.customerName || "");
    setEmail(invoice.email || "");
    setPhone(invoice.phone || "");
    setStatus(invoice.status);
    setDate(toLocalDateTimeInput(invoice.date || ""));
    setDueDate(toLocalDateTimeInput(invoice.dueDate || ""));
    setAmount(String(invoice.amount ?? 0));
    setError(null);
    // Load current linkage and leads in parallel
    loadLeads();
    (async () => {
      try {
        const resp = await fetch(`/api/invoices/${invoice.id}`);
        if (!resp.ok) return;
        const data = await resp.json();
        const currentLeadId = (data as any)?.lead_id as string | undefined;
        setLeadId(currentLeadId || undefined);
      } catch {}
    })();
  }, [open, invoice]);

  function close() { onOpenChange(false); }

  async function ensureLeadIdIfNeeded(): Promise<string | undefined> {
    if (leadId) return leadId;
    // Create a new lead from current fields
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

  function handleSave() {
    setError(null);
    if (leadId && !email.trim()) {
      setError('Linked lead is missing an email. Please edit the lead or unlink and create a new lead.');
      return;
    }
    const base: any = {
      customer_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      status,
      date: date ? new Date(date).toISOString() : undefined,
      due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
      amount: Number(amount) || 0,
    };
    startTransition(async () => {
      try {
        // Ensure linkage according to selection
        const finalLeadId = await ensureLeadIdIfNeeded();
        const payload = { ...base, lead_id: finalLeadId } as any;
        const res = await fetch(`/api/invoices/${invoice.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        window.dispatchEvent(new Event('invoices:changed'));
        onSaved?.();
        close();
      } catch (e: any) {
        setError(typeof e?.message === 'string' ? e.message : 'Failed to save invoice');
        toast.error('Failed to save invoice');
      }
    });
  }

  const isLinked = !!leadId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
          <DialogDescription>Update customer details, status, and dates. Times are local.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm">Customer Name</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} readOnly={isLinked} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} readOnly={isLinked} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} readOnly={isLinked} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Issue Date</label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Due Date</label>
            <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Amount</label>
            <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm">Link to Lead (Optional)</label>
            <Select value={leadId || 'none'} onValueChange={(v: any) => {
              const newLeadId = v === 'none' ? undefined : v;
              setLeadId(newLeadId);
              const selected = leads.find(l => l.id === newLeadId);
              if (selected) {
                setCustomerName(selected.full_name || "");
                setEmail(selected.email || "");
                setPhone(selected.phone || "");
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
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">{error}</div>}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending}>{pending ? 'Saving…' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}




