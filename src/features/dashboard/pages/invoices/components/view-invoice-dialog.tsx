"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LeadNotesPanel } from "@/features/dashboard/pages/leads/components/lead-notes-panel";
import type { Invoice } from "@/features/dashboard/pages/invoices/types/invoice";
import { formatINRMajor } from "@/utils/currency";

interface ViewInvoiceDialogProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewInvoiceDialog({ invoice, open, onOpenChange }: ViewInvoiceDialogProps) {
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [subjectError, setSubjectError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    async function loadSubject() {
      setLoadingSubject(true);
      setSubjectError(null);
      setSubjectId(null);

      try {
        if (!invoice.customerId) {
          return;
        }

        const res = await fetch(`/api/customers/${invoice.customerId}`);
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const data = (await res.json()) as any;
        const nextSubjectId = (data as any)?.subject_id ?? null;
        if (!cancelled) {
          setSubjectId(nextSubjectId);
        }
      } catch (e: any) {
        if (!cancelled) {
          setSubjectError(
            typeof e?.message === "string" ? e.message : "Failed to resolve subject for this invoice",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSubject(false);
        }
      }
    }

    loadSubject();

    return () => {
      cancelled = true;
    };
  }, [open, invoice.customerId]);

  const amountLabel = formatINRMajor(invoice.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Invoice {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Customer details, status, and subject level notes for this invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Customer:</span>{" "}
              <span>{invoice.customerName || "Unknown"}</span>
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              <span className="text-muted-foreground">{invoice.email || "-"}</span>
            </div>
            <div>
              <span className="font-medium">Phone:</span>{" "}
              <span className="text-muted-foreground">{invoice.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant="outline">{invoice.status}</Badge>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Amount:</span>{" "}
              <span>{amountLabel}</span>
            </div>
            <div>
              <span className="font-medium">Issue date:</span>{" "}
              <span className="text-muted-foreground">
                {invoice.date ? new Date(invoice.date).toLocaleString() : "-"}
              </span>
            </div>
            <div>
              <span className="font-medium">Due date:</span>{" "}
              <span className="text-muted-foreground">
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleString() : "-"}
              </span>
            </div>
            <div>
              <span className="font-medium">Items:</span>{" "}
              <span className="text-muted-foreground">{invoice.items}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="text-sm font-medium">Notes</div>
          {subjectError ? (
            <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
              {subjectError}
            </div>
          ) : null}
          {loadingSubject && !subjectId ? (
            <div className="text-xs text-muted-foreground">Resolving subject for this invoice...</div>
          ) : null}
          <LeadNotesPanel subjectId={subjectId} />
          {!invoice.customerId && (
            <div className="text-[11px] text-muted-foreground">
              Notes are linked to the underlying subject. Attach this invoice to a customer to enable notes.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

