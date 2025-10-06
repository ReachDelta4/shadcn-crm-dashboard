"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ProductPicker, type Product } from "@/features/dashboard/components/product-picker";
import { PaymentPlanPicker, type PaymentPlan } from "@/features/dashboard/components/payment-plan-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface LineItem {
  product_id: string;
  product?: Product;
  quantity: number;
  discount_type?: "percent" | "amount";
  discount_value?: number;
  payment_plan_id?: string | null;
  payment_plan?: PaymentPlan | null;
}

const schema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  email: z.string().email("Valid email is required"),
  status: z.enum(["draft", "pending", "paid", "overdue", "cancelled"]).default("draft"),
  lead_id: z.string().uuid().optional(),
  line_items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    discount_type: z.enum(["percent", "amount"]).optional(),
    discount_value: z.number().int().min(0).optional(),
    payment_plan_id: z.string().uuid().optional(),
  })).min(1),
});

interface NewInvoiceDialogV2Props {
  onCreated?: () => void;
}

export function NewInvoiceDialogV2({ onCreated }: NewInvoiceDialogV2Props) {
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"draft" | "pending" | "paid" | "overdue" | "cancelled">("draft");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [leadId, setLeadId] = useState<string | undefined>(undefined);

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { product_id: "", quantity: 1 },
  ]);

  useEffect(() => { loadLeads() }, []);

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
      const res = await fetch('/api/leads?pageSize=50');
      if (!res.ok) return;
      const data = await res.json();
      const list = (data?.data || [])
        .filter((l: any) => (l.status || 'new') !== 'converted')
        .map((l: any) => ({ id: l.id, full_name: l.full_name, email: l.email }));
      setLeads(list);
    } catch { }
  }

  function resetForm() {
    setCustomerName("");
    setEmail("");
    setStatus("draft");
    setLeadId(undefined);
    setLineItems([{ product_id: "", quantity: 1 }]);
    setError(null);
  }

  function updateLine(idx: number, patch: Partial<LineItem>) {
    setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, ...patch } : li));
  }

  function addLine() {
    setLineItems(prev => [...prev, { product_id: "", quantity: 1 }]);
  }

  function removeLine(idx: number) {
    if (lineItems.length === 1) return; // Keep at least one line
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  }

  // Calculate preview totals (client-side estimate)
  const previewTotals = lineItems.reduce((acc, item) => {
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
    const tax = Math.floor((afterDiscount * (item.product as any).tax_rate_bp || 0) / 10000);
    const total = afterDiscount + tax;

    return {
      subtotal: acc.subtotal + subtotal,
      discount: acc.discount + discount,
      tax: acc.tax + tax,
      total: acc.total + total,
    };
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = schema.safeParse({
      customer_name: customerName.trim(),
      email: email.trim(),
      status,
      lead_id: leadId,
      line_items: lineItems.map(li => ({
        product_id: li.product_id,
        quantity: li.quantity,
        discount_type: li.discount_type,
        discount_value: li.discount_value,
        payment_plan_id: li.payment_plan_id,
      })),
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "Invalid input");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
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

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          New Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>Create an invoice with product selection and optional payment plans.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-6">
          {/* Customer Information */}
          <div className="grid gap-4">
            <h3 className="text-sm font-medium">Customer Information</h3>
            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
              <div className="grid gap-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input 
                  id="customer_name" 
                  value={customerName} 
                  onChange={(e) => setCustomerName(e.target.value)} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Link to Lead (Optional)</Label>
              <Select value={leadId} onValueChange={(v: any) => {
                setLeadId(v)
                const selected = leads.find(l => l.id === v)
                if (selected) {
                  setCustomerName(selected.full_name || "")
                  setEmail(selected.email || "")
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead to link" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map(l => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name} ({l.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Line Items */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine}>
                <Plus className="size-4 mr-1" />
                Add Line
              </Button>
            </div>

            <div className="space-y-4">
              {lineItems.map((item, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Product</Label>
                        <ProductPicker
                          value={item.product_id}
                          onValueChange={(productId, product) => {
                            updateLine(idx, { 
                              product_id: productId, 
                              product,
                              // Reset payment plan when product changes
                              payment_plan_id: null,
                              payment_plan: null,
                            });
                          }}
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateLine(idx, { quantity: parseInt(e.target.value) || 1 })}
                          />
                        </div>

                        {/* Only show payment plan picker for non-recurring products */}
                        {item.product && !item.product.recurring_interval && (
                          <div className="grid gap-2">
                            <Label>Payment Plan (Optional)</Label>
                            <PaymentPlanPicker
                              productId={item.product_id}
                              value={item.payment_plan_id || undefined}
                              onValueChange={(planId, plan) => {
                                updateLine(idx, { payment_plan_id: planId, payment_plan: plan });
                              }}
                            />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="grid gap-2">
                          <Label>Discount Type</Label>
                          <Select 
                            value={item.discount_type} 
                            onValueChange={(v: any) => updateLine(idx, { discount_type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="No discount" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percent">Percent</SelectItem>
                              <SelectItem value="amount">Amount</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>Discount Value</Label>
                          <Input
                            type="number"
                            min={0}
                            value={item.discount_value || ""}
                            onChange={(e) => updateLine(idx, { 
                              discount_value: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            placeholder="0"
                          />
                        </div>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLine(idx)}
                            disabled={lineItems.length === 1}
                            className="w-full"
                          >
                            <Trash2 className="size-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>

                      {/* Line Preview */}
                      {item.product && (
                        <div className="grid grid-cols-2 gap-2 text-xs rounded-md border p-2 bg-muted/30">
                          {(() => {
                            const unitPriceMinor = item.product ? item.product.price_minor : 0;
                            const subtotalMinor = unitPriceMinor * (item.quantity || 1);
                            let discountMinor = 0;
                            if (item.discount_value && item.discount_value > 0) {
                              if (item.discount_type === "percent") {
                                discountMinor = Math.floor((subtotalMinor * item.discount_value) / 10000);
                              } else {
                                discountMinor = item.discount_value;
                              }
                            }
                            const afterDiscountMinor = Math.max(0, subtotalMinor - discountMinor);
                            const taxBp = (item.product as any).tax_rate_bp || 0;
                            const taxMinor = Math.floor((afterDiscountMinor * taxBp) / 10000);
                            const totalMinor = afterDiscountMinor + taxMinor;
                            const currency = item.product.currency || 'USD';
                            return (
                              <>
                                <div className="text-muted-foreground">Unit price</div>
                                <div className="text-right">{(unitPriceMinor/100).toLocaleString(undefined, { style: 'currency', currency })}</div>
                                <div className="text-muted-foreground">Subtotal</div>
                                <div className="text-right">{(subtotalMinor/100).toLocaleString(undefined, { style: 'currency', currency })}</div>
                                <div className="text-muted-foreground">Discount</div>
                                <div className="text-right">-{(discountMinor/100).toLocaleString(undefined, { style: 'currency', currency })}</div>
                                <div className="text-muted-foreground">Tax</div>
                                <div className="text-right">{(taxMinor/100).toLocaleString(undefined, { style: 'currency', currency })}</div>
                                <div className="text-muted-foreground font-medium">Line total</div>
                                <div className="text-right font-medium">{(totalMinor/100).toLocaleString(undefined, { style: 'currency', currency })}</div>
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview Totals */}
          {previewTotals.total > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Preview Totals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">
                    {(previewTotals.subtotal / 100).toLocaleString(undefined, { 
                      style: 'currency', 
                      currency: lineItems[0]?.product?.currency || 'USD' 
                    })}
                  </span>
                </div>
                {previewTotals.discount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Discount:</span>
                    <span>
                      -{(previewTotals.discount / 100).toLocaleString(undefined, { 
                        style: 'currency', 
                        currency: lineItems[0]?.product?.currency || 'USD' 
                      })}
                    </span>
                  </div>
                )}
                {previewTotals.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax:</span>
                    <span>
                      {(previewTotals.tax / 100).toLocaleString(undefined, { 
                        style: 'currency', 
                        currency: lineItems[0]?.product?.currency || 'USD' 
                      })}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total:</span>
                  <span>
                    {(previewTotals.total / 100).toLocaleString(undefined, { 
                      style: 'currency', 
                      currency: lineItems[0]?.product?.currency || 'USD' 
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground pt-2">
                  * Final total will be calculated by the server
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md" role="alert">
              {error}
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={pending || lineItems.some(li => !li.product_id)}>
              {pending ? "Creating…" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
