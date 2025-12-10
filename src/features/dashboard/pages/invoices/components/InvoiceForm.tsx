"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProductPicker, type Product } from "@/features/dashboard/components/product-picker";
import { PaymentPlanPicker, type PaymentPlan } from "@/features/dashboard/components/payment-plan-picker";
import { formatINRMinor } from "@/utils/currency";
import { buildLeadCreationIdempotencyKey } from "@/features/leads/status-utils";
import { debounce } from "@/utils/timing/debounce";
import { NoteField } from "@/features/dashboard/components/note-field";
import { createSubjectNoteIfPresent } from "@/features/dashboard/utils/subject-notes";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";

export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";

export interface InvoiceLineForm {
  product_id: string;
  product?: Product;
  quantity: number;
  discount_type?: "percent" | "amount";
  discount_value?: number;
  payment_plan_id?: string | null;
  payment_plan?: PaymentPlan | null;
  recurring_cycles_count?: number;
  recurring_infinite?: boolean;
}

const schema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  status: z.enum(["draft","pending","paid","overdue","cancelled"]).default("draft"),
  due_date: z.string().optional(),
  lead_id: z.string().uuid().optional(),
  line_items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    discount_type: z.enum(["percent","amount"]).optional(),
    discount_value: z.number().int().min(0).optional(),
    payment_plan_id: z.string().uuid().optional(),
    recurring_cycles_count: z.number().int().min(1).optional(),
    recurring_infinite: z.boolean().optional(),
  })).min(1),
});

export interface InvoiceFormDefaults {
  customer_name?: string;
  email?: string;
  phone?: string;
  status?: InvoiceStatus;
  due_date?: string;
  lead_id?: string;
  line_items?: InvoiceLineForm[];
}

export interface InvoiceFormProps {
  defaultValues?: InvoiceFormDefaults;
  showLeadSelector?: boolean;
  allowLeadCreation?: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  onCreated?: (invoice: any) => void;
  beforeSubmit?: (data: z.infer<typeof schema>) => Promise<void>;
}

interface LeadOption { id: string; full_name: string; email: string; phone?: string }

function normalizeInvoiceLeadOptions(rows: any[]): LeadOption[] {
  return (rows || [])
    .filter((l: any) => (l?.status || "new") !== "converted")
    .map((l: any) => ({
      id: l.id as string,
      full_name: l.full_name || "",
      email: l.email || "",
      phone: l.phone || undefined,
    }));
}

function normalizeDefaults(defaults?: InvoiceFormDefaults) {
  return {
    customer_name: defaults?.customer_name ?? "",
    email: defaults?.email ?? "",
    phone: defaults?.phone ?? "",
    status: (defaults?.status ?? 'draft') as InvoiceStatus,
    due_date: defaults?.due_date,
    lead_id: defaults?.lead_id,
    line_items: (defaults?.line_items && defaults.line_items.length > 0)
      ? defaults.line_items.map(item => ({
          product_id: item.product_id || "",
          product: item.product,
          quantity: item.quantity || 1,
          discount_type: item.discount_type,
          discount_value: item.discount_value,
          payment_plan_id: item.payment_plan_id ?? undefined,
          payment_plan: item.payment_plan ?? null,
          recurring_cycles_count: item.recurring_cycles_count,
          recurring_infinite: item.recurring_infinite,
        }))
      : [{ product_id: "", quantity: 1 }],
  } satisfies InvoiceFormDefaults & { line_items: InvoiceLineForm[] };
}

export function InvoiceForm({
  defaultValues,
  showLeadSelector = true,
  allowLeadCreation = true,
  submitLabel = "Create Invoice",
  onCancel,
  onCreated,
  beforeSubmit,
}: InvoiceFormProps) {
  const normalizedDefaults = useMemo(() => normalizeDefaults(defaultValues), [defaultValues]);

  const [customerName, setCustomerName] = useState(normalizedDefaults.customer_name);
  const [email, setEmail] = useState(normalizedDefaults.email);
  const [phone, setPhone] = useState(normalizedDefaults.phone || "");
  const [status, setStatus] = useState<InvoiceStatus>(normalizedDefaults.status);
  const [dueDate, setDueDate] = useState<string | undefined>(normalizedDefaults.due_date);
  const [leadId, setLeadId] = useState<string | undefined>(normalizedDefaults.lead_id);
  const [lineItems, setLineItems] = useState<InvoiceLineForm[]>(normalizedDefaults.line_items);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCustomerName(normalizedDefaults.customer_name);
    setEmail(normalizedDefaults.email);
    setPhone(normalizedDefaults.phone ?? "");
    setStatus(normalizedDefaults.status);
    setDueDate(normalizedDefaults.due_date);
    setLeadId(normalizedDefaults.lead_id);
    setLineItems(normalizedDefaults.line_items);
    setNote("");
  }, [normalizedDefaults]);

  useEffect(() => {
    if (!showLeadSelector) {
      setLeads([]);
      return;
    }
    let cancelled = false;
    const fetchLeads = async () => {
      try {
        const res = await fetch('/api/leads?pageSize=50');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const list = normalizeInvoiceLeadOptions(data?.data || []);
        setLeads(list);
      } catch {
        if (!cancelled) {
          setLeads([]);
        }
      }
    };

    if (leadSelectorOpen) {
      fetchLeads();
    }

    const refresh = debounce(() => {
      if (leadSelectorOpen) {
        fetchLeads();
      }
    }, 150);

    window.addEventListener('leads:changed', refresh);
    window.addEventListener('leads:optimistic', refresh as any);
    return () => {
      cancelled = true;
      window.removeEventListener('leads:changed', refresh);
      window.removeEventListener('leads:optimistic', refresh as any);
    };
  }, [showLeadSelector, leadSelectorOpen]);

  function resetForm() {
    setCustomerName(normalizedDefaults.customer_name);
    setEmail(normalizedDefaults.email);
    setPhone(normalizedDefaults.phone ?? "");
    setStatus(normalizedDefaults.status);
    setDueDate(normalizedDefaults.due_date);
    setLeadId(normalizedDefaults.lead_id);
    setLineItems(normalizedDefaults.line_items);
    setError(null);
    setNote("");
  }

  function updateLine(idx: number, patch: Partial<InvoiceLineForm>) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, ...patch } : li));
  }

  function addLine() {
    setLineItems(prev => [...prev, { product_id: "", quantity: 1 }]);
  }

  function removeLine(idx: number) {
    if (lineItems.length === 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  }

  const previewTotals = useMemo(() => lineItems.reduce((acc, item) => {
    if (!item.product) return acc;
    const unitPrice = item.product.price_minor;
    const subtotal = unitPrice * item.quantity;

    let discount = 0;
    if (item.discount_value && item.discount_value > 0) {
      if (item.discount_type === "percent") {
        discount = Math.floor((subtotal * item.discount_value) / 10000);
      } else {
        discount = item.discount_value;
      }
    }

    const afterDiscount = subtotal - discount;
    const taxRate = (item.product as any)?.tax_rate_bp || 0;
    const tax = Math.floor((afterDiscount * taxRate) / 10000);
    const total = afterDiscount + tax;

    return {
      subtotal: acc.subtotal + subtotal,
      discount: acc.discount + discount,
      tax: acc.tax + tax,
      total: acc.total + total,
    };
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 }), [lineItems]);

  async function ensureLeadIdIfNeeded(
    currentLeadId?: string,
  ): Promise<string | undefined> {
    if (currentLeadId) return currentLeadId;
    if (!allowLeadCreation) return undefined;
    if (!phone.trim()) throw new Error("Phone number is required to create a lead");
    if (!email.trim()) throw new Error("Email is required to create a lead");
    if (!customerName.trim()) throw new Error("Customer name is required to create a lead");

    const payload = {
      full_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: undefined as string | undefined,
    };

    const headerKey =
      buildLeadCreationIdempotencyKey({
        fullName: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        company: payload.company,
      }) ?? undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (headerKey) {
      headers["Idempotency-Key"] = headerKey;
    }

    const create = await fetch("/api/leads", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!create.ok) {
      const body = await create.json().catch(() => ({}));
      throw new Error(body?.error || "Failed to create lead");
    }
    const lead = (await create.json().catch(() => null)) as any;
    return lead?.id as string | undefined;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (submitting || pending) return;

    const parsed = schema.safeParse({
      customer_name: customerName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      status,
      due_date: dueDate,
      lead_id: leadId,
      line_items: lineItems.map(li => ({
        product_id: li.product_id,
        quantity: li.quantity,
        discount_type: li.discount_type,
        discount_value: li.discount_value,
        payment_plan_id: li.payment_plan_id ?? undefined,
        recurring_cycles_count: li.recurring_cycles_count,
        recurring_infinite: li.recurring_infinite,
      })),
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    if ((leadId || parsed.data.lead_id) && !email.trim()) {
      setError('Linked lead is missing an email. Please edit the lead or unlink and create a new lead.');
      return;
    }

    setSubmitting(true);
    startTransition(async () => {
      try {
        if (beforeSubmit) await beforeSubmit(parsed.data);
        const finalLeadId = await ensureLeadIdIfNeeded(parsed.data.lead_id);
        const payload = {
          ...parsed.data,
          phone: phone.trim() || undefined,
          due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
          lead_id: finalLeadId,
          line_items: parsed.data.line_items.map(li => ({
            product_id: li.product_id,
            quantity: li.quantity,
            discount_type: li.discount_type,
            discount_value: li.discount_value,
            payment_plan_id: li.payment_plan_id,
            recurring_cycles_count: li.recurring_cycles_count,
            recurring_infinite: li.recurring_infinite,
          })),
        };

        const res = await fetch('/api/invoices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || 'Failed to create invoice');
        }
        const invoice = await res.json();
        if (note.trim()) {
          const noteResult = await createSubjectNoteIfPresent(note, {
            subjectId: invoice?.subject_id ?? invoice?.subjectId ?? null,
            customerId: invoice?.customer_id ?? invoice?.customerId ?? null,
            leadId: invoice?.lead_id ?? invoice?.leadId ?? finalLeadId,
          });
          if (!noteResult.posted && noteResult.reason !== "empty") {
            toast.warning(noteResult.reason === "missing-subject" ? "Invoice saved. Notes need a linked subject to persist." : "Invoice saved, but note could not be saved.");
          }
        }
        onCreated?.(invoice);
        window.dispatchEvent(new Event('invoices:changed'));
        resetForm();
      } catch (err: any) {
        setError(typeof err?.message === 'string' ? err.message : 'Failed to create invoice');
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Card>
        <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="customer_name">Full name</Label>
            <Input id="customer_name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone</Label>
            <PhoneInput
              id="phone"
              value={phone}
              defaultCountry="IN"
              onChange={(v) => setPhone((v as string) || "")}
              placeholder="Enter phone number"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v: InvoiceStatus) => setStatus(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input id="due_date" type="datetime-local" value={dueDate ? dueDate.slice(0,16) : ""} onChange={(e) => setDueDate(e.target.value || undefined)} />
          </div>
          {showLeadSelector && (
            <div className="grid gap-2">
              <Label htmlFor="lead_id">Link to Lead</Label>
              <Select
                value={leadId || "none"}
                onOpenChange={setLeadSelectorOpen}
                onValueChange={(v) => setLeadId(v === 'none' ? undefined : v)}
              >
                <SelectTrigger><SelectValue placeholder="No lead" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No lead</SelectItem>
                  {leads.map(lead => (
                    <SelectItem key={lead.id} value={lead.id}>{lead.full_name} ({lead.email})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="sm:col-span-2">
            <NoteField value={note} onChange={setNote} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lineItems.map((item, idx) => {
            const paymentPlanAllowed = item.product ? !item.product.recurring_interval : true;
            return (
              <div key={idx} className="grid gap-3 border rounded-lg p-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Product</Label>
                    <ProductPicker
                      value={item.product_id || undefined}
                      onValueChange={(pid, product) => updateLine(idx, { product_id: pid || "", product, payment_plan_id: undefined, payment_plan: null })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input type="number" min={1} value={item.quantity}
                      onChange={(e) => updateLine(idx, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Select value={item.discount_type || "none"} onValueChange={(v) => updateLine(idx, { discount_type: v === 'none' ? undefined : v as "percent" | "amount" })}>
                    <SelectTrigger><SelectValue placeholder="No Discount" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Discount</SelectItem>
                      <SelectItem value="percent">Percent</SelectItem>
                      <SelectItem value="amount">Amount (minor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                  <div className="grid gap-2">
                    <Label>Discount Value</Label>
                    <Input type="number" min={0} value={item.discount_value ?? ""}
                      onChange={(e) => updateLine(idx, { discount_value: e.target.value ? Math.max(0, Number(e.target.value) || 0) : undefined })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Payment Plan</Label>
                    {paymentPlanAllowed ? (
                      <PaymentPlanPicker
                        productId={item.product_id ? item.product_id : null}
                        value={item.payment_plan_id ?? undefined}
                        onValueChange={(pid, plan) => updateLine(idx, { payment_plan_id: pid ?? undefined, payment_plan: plan })}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground py-2">Payment plans are only available for one-time products.</div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Recurring Cycles</Label>
                    <Input type="number" min={1} value={item.recurring_cycles_count ?? ""}
                      onChange={(e) => updateLine(idx, { recurring_cycles_count: e.target.value ? Math.max(1, Number(e.target.value) || 1) : undefined })}
                      disabled={!item.product || !item.product.recurring_interval}
                    />
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeLine(idx)} disabled={lineItems.length === 1}>Remove</Button>
                </div>
              </div>
            );
          })}
          <Button type="button" variant="outline" onClick={addLine}>Add Line</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Subtotal</div>
          <div className="text-right font-medium">{formatINRMinor(previewTotals.subtotal)}</div>
          <div className="text-muted-foreground">Discount</div>
          <div className="text-right font-medium">{formatINRMinor(previewTotals.discount)}</div>
          <div className="text-muted-foreground">Tax</div>
          <div className="text-right font-medium">{formatINRMinor(previewTotals.tax)}</div>
          <Separator className="sm:col-span-2" />
          <div className="text-muted-foreground">Total</div>
          <div className="text-right text-lg font-semibold">{formatINRMinor(previewTotals.total)}</div>
        </CardContent>
      </Card>

      {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending || submitting}>Cancel</Button>
        )}
        <Button type="submit" disabled={pending || submitting}>{pending || submitting ? 'Saving...' : submitLabel}</Button>
      </div>
    </form>
  );
}
