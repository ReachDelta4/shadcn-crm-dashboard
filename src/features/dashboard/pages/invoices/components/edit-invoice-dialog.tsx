"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Invoice, InvoiceStatus } from "../../types/invoice";
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

  useEffect(() => {
    if (!open) return;
    setCustomerName(invoice.customerName || "");
    setEmail(invoice.email || "");
    setPhone(invoice.phone || "");
    setStatus(invoice.status);
    setDate(invoice.date || "");
    setDueDate(invoice.dueDate || "");
    setAmount(String(invoice.amount ?? 0));
    setError(null);
  }, [open, invoice]);

  function close() { onOpenChange(false); }

  function handleSave() {
    setError(null);
    const payload: any = {
      customer_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      status,
      date: date || undefined,
      due_date: dueDate || undefined,
      amount: Number(amount) || 0,
    };
    startTransition(async () => {
      try {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm">Customer Name</label>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Phone</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
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


