"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import type { Customer } from "@/features/dashboard/pages/customers/types/customer";

interface EditCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange, onSaved }: EditCustomerDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"active"|"inactive"|"pending"|"churned">("active");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(customer.fullName || "");
    setEmail(customer.email || "");
    setCompany(customer.company || "");
    setLocation(customer.location || "");
    setStatus((customer.status as any) || "active");
    setError(null);
  }, [open, customer]);

  function close() { onOpenChange(false); }

  function handleSave() {
    setError(null);
    if (submitting || pending) return;
    setSubmitting(true);
    startTransition(async () => {
      try {
        const payload: any = {
          full_name: fullName.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          location: location.trim() || undefined,
          status,
        };
        const res = await fetch(`/api/customers/${customer.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(await res.text());
        onSaved?.();
        toast.success('Customer updated');
        close();
      } catch (e: any) {
        setError(typeof e?.message === 'string' ? e.message : 'Failed to update customer');
        toast.error('Failed to update customer');
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update core fields and status.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm">Full name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Company</label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="churned">Churned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">{error}</div>}
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={close} disabled={pending || submitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending || submitting}>{pending || submitting ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
