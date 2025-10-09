"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductPicker, type Product } from "@/features/dashboard/components/product-picker";
import { PaymentPlanPicker, type PaymentPlan } from "@/features/dashboard/components/payment-plan-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface ConvertLeadDialogProps {
  leadId: string;
  leadName: string;
  leadEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted?: () => void;
}

export function ConvertLeadDialog({ leadId, leadName, leadEmail, open, onOpenChange, onCompleted }: ConvertLeadDialogProps) {
  const [customerName, setCustomerName] = useState(leadName || "");
  const [email, setEmail] = useState(leadEmail || "");
  const [phone, setPhone] = useState("");
  const [createInvoice, setCreateInvoice] = useState(true);
  const [markPaid, setMarkPaid] = useState(true);

  const [productId, setProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [unitPriceMinorOverride, setUnitPriceMinorOverride] = useState<string>("");

  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setCustomerName(leadName || "");
    setEmail(leadEmail || "");
    setPhone("");
    setCreateInvoice(true);
    setMarkPaid(true);
    setProductId(null);
    setSelectedProduct(null);
    setPlanId(null);
    setSelectedPlan(null);
    setQuantity("1");
    setUnitPriceMinorOverride("");
  }, [open, leadName, leadEmail]);

  const totalMinor = useMemo(() => {
    const q = Math.max(1, Number(quantity) || 1);
    const base = selectedProduct ? selectedProduct.price_minor : 0;
    const override = unitPriceMinorOverride ? Math.max(0, Number(unitPriceMinorOverride) || 0) : undefined;
    return q * (override ?? base);
  }, [selectedProduct, quantity, unitPriceMinorOverride]);

  async function handleSubmit() {
    startTransition(async () => {
      try {
        // 1) Convert lead to customer (server handles linking and ownership)
        const convertRes = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
        if (!convertRes.ok) throw new Error(await convertRes.text());

        // 2) Optionally create invoice
        let createdInvoice: any = null;
        if (createInvoice && selectedProduct) {
          const lineItems = [{
            product_id: selectedProduct.id,
            quantity: Math.max(1, Number(quantity) || 1),
            unit_price_override_minor: unitPriceMinorOverride ? Math.max(0, Number(unitPriceMinorOverride) || 0) : undefined,
            payment_plan_id: planId || undefined,
          }];
          const invoicePayload: any = {
            customer_name: customerName || leadName,
            email: email || leadEmail,
            status: 'draft',
            line_items: lineItems,
            lead_id: leadId,
          };
          const invRes = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(invoicePayload) });
          if (!invRes.ok) throw new Error(await invRes.text());
          createdInvoice = await invRes.json();
        }

        // 3) Optionally mark paid
        if (createInvoice && markPaid && createdInvoice?.id) {
          // Naive: mark invoice paid by updating status; schedules will be reconciled by API logic
          await fetch(`/api/invoices/${createdInvoice.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'paid' }) }).catch(() => {});
        }

        // Emit changes
        window.dispatchEvent(new Event('leads:changed'));
        window.dispatchEvent(new Event('customers:changed'));
        if (createInvoice) window.dispatchEvent(new Event('invoices:changed'));

        toast.success('Lead converted successfully');
        onCompleted?.();
        onOpenChange(false);
      } catch (e: any) {
        toast.error(typeof e?.message === 'string' ? e.message : 'Conversion failed');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <Card>
            <CardHeader><CardTitle>Customer Details</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Full Name</label>
                  <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Invoice (optional)</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              <div className="flex items-center gap-2">
                <input id="createInvoice" type="checkbox" checked={createInvoice} onChange={(e) => setCreateInvoice(e.target.checked)} />
                <label htmlFor="createInvoice" className="text-sm">Create invoice</label>
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
                      <div className="text-sm">Total: {(totalMinor/100).toLocaleString()}</div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={pending}>{pending ? 'Converting…' : 'Convert'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


