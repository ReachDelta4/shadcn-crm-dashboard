"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceForm } from "@/features/dashboard/pages/invoices/components/InvoiceForm";
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
  const [invoices, setInvoices] = useState<any[]>([]);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${leadId}/invoices`);
      if (!res.ok) return;
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch {}
  }, [leadId]);

  useEffect(() => {
    if (!open) return;
    loadInvoices();
  }, [open, loadInvoices]);

  useEffect(() => {
    if (!open) return;
    const refresh = () => loadInvoices();
    const interval = setInterval(refresh, 8000);
    window.addEventListener('invoices:changed', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('invoices:changed', refresh);
    }
  }, [open, loadInvoices]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert Lead</DialogTitle>
          <DialogDescription>
            Complete the invoice below. Invoice statuses reflect live data; when an invoice is paid, the customer becomes active automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <InvoiceForm
            defaultValues={{
              customer_name: leadName || "",
              email: leadEmail || "",
              lead_id: leadId,
              status: 'draft',
              line_items: [{ product_id: "", quantity: 1 }],
            }}
            showLeadSelector={false}
            allowLeadCreation={false}
            submitLabel="Convert Lead"
            onCancel={() => onOpenChange(false)}
            beforeSubmit={async () => {
              const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' });
              if (!res.ok) throw new Error(await res.text());
            }}
            onCreated={() => {
              toast.success('Lead converted successfully');
              loadInvoices();
              onCompleted?.();
              window.dispatchEvent(new Event('leads:changed'));
              window.dispatchEvent(new Event('customers:changed'));
              onOpenChange(false);
            }}
          />

          <Card>
            <CardHeader><CardTitle>Invoices for this Lead</CardTitle></CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-sm text-muted-foreground">No invoices yet</div>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between border rounded p-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{inv.invoice_number || inv.id}</span>
                        <span className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded">{inv.status}</span>
                        <span className="text-sm font-medium">{(inv.amount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
