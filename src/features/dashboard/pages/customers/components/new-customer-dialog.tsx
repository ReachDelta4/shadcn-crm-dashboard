"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductPicker, type Product } from "@/features/dashboard/components/product-picker";
import { PaymentPlanPicker, type PaymentPlan } from "@/features/dashboard/components/payment-plan-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { NoteField } from "@/features/dashboard/components/note-field";
import { createSubjectNoteIfPresent } from "@/features/dashboard/utils/subject-notes";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

interface NewCustomerDialogProps {
  onCreated?: () => void;
}

export function NewCustomerDialog({ onCreated }: NewCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "pending">("active");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Optional invoice fields
  const [createInvoice, setCreateInvoice] = useState(false);
  const [markPaid, setMarkPaid] = useState(true);
  const [productId, setProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPriceMinorOverride, setUnitPriceMinorOverride] = useState<string>("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function resetForm() {
    setFullName("");
    setEmail("");
    setCompany("");
    setPhone("");
    setLocation("");
    setStatus("active");
    setError(null);
    setCreateInvoice(false);
    setMarkPaid(true);
    setProductId(null);
    setSelectedProduct(null);
    setPlanId(null);
    setSelectedPlan(null);
    setQuantity("1");
    setUnitPriceMinorOverride("");
    setNote("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (submitting || pending) return;

    const parsed = schema.safeParse({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
      location: location.trim() || undefined,
      status,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    setSubmitting(true);
    startTransition(async () => {
      try {
        const res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to create customer");
        }
        const customer = await res.json().catch(() => null);
        if (note.trim()) {
          const noteResult = await createSubjectNoteIfPresent(note, {
            subjectId: customer?.subject_id ?? customer?.subjectId ?? null,
            customerId: customer?.id,
          });
          if (!noteResult.posted && noteResult.reason !== "empty") {
            toast.warning(
              noteResult.reason === "missing-subject"
                ? "Customer created, but notes need a subject to save."
                : "Customer created, but note could not be saved.",
            );
          }
        }
        // Optionally create invoice
        if (createInvoice && selectedProduct) {
          const lineItems = [{
            product_id: selectedProduct.id,
            quantity: Math.max(1, Number(quantity) || 1),
            unit_price_override_minor: unitPriceMinorOverride ? Math.max(0, Number(unitPriceMinorOverride) || 0) : undefined,
            payment_plan_id: planId || undefined,
          }];
          const invoicePayload: any = {
            customer_name: fullName.trim(),
            email: email.trim(),
            status: 'draft',
            line_items: lineItems,
          };
          const invRes = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoicePayload) });
          if (invRes.ok && markPaid) {
            const inv = await invRes.json().catch(() => null);
            if (inv?.id) await fetch(`/api/invoices/${inv.id}/pay`, { method: 'POST' }).catch(() => {})
          }
        }

        onCreated?.();
        setOpen(false);
        resetForm();
      } catch (err: any) {
        setError(typeof err?.message === "string" ? err.message : "Failed to create customer");
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Create new customer</DialogTitle>
          <DialogDescription>
            Add a new customer. Fields marked required must be completed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <NoteField value={note} onChange={setNote} />

          <Card>
            <CardHeader><CardTitle>Initial Invoice (optional)</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center gap-2">
                <input id="createInvoice" type="checkbox" checked={createInvoice} onChange={(e) => setCreateInvoice(e.target.checked)} />
                <label htmlFor="createInvoice" className="text-sm">Create invoice after customer</label>
              </div>
              {createInvoice && (
                <div className="grid gap-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm">Product</label>
                      <ProductPicker value={productId || undefined} onValueChange={(pid, p) => { setProductId(pid); setSelectedProduct(p); }} />
                    </div>
                    <div>
                      <label className="text-sm">Payment Plan</label>
                      <PaymentPlanPicker productId={productId} value={planId || undefined} onValueChange={(plid, pl) => { setPlanId(plid); setSelectedPlan(pl); }} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm">Quantity</label>
                      <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm">Unit Price (minor, override)</label>
                      <Input type="number" min={0} value={unitPriceMinorOverride} onChange={(e) => setUnitPriceMinorOverride(e.target.value)} />
                    </div>
                    <div className="flex items-end justify-end">
                      <div className="text-sm">Total: {(((selectedProduct?.price_minor || 0) * (Math.max(1, Number(quantity) || 1))) / 100).toLocaleString()}</div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <input id="markPaid" type="checkbox" checked={markPaid} onChange={(e) => setMarkPaid(e.target.checked)} />
                    <label htmlFor="markPaid" className="text-sm">Mark as paid after creation</label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="text-sm text-red-600" role="alert">{error}</div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending || submitting}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending || submitting}>
              {pending || submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}







































