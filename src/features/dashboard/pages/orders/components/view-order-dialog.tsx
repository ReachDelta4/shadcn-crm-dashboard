"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LeadNotesPanel } from "@/features/dashboard/pages/leads/components/lead-notes-panel";
import type { Order } from "@/features/dashboard/pages/orders/types/order";
import { formatINRMajor } from "@/utils/currency";

interface ViewOrderDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewOrderDialog({ order, open, onOpenChange }: ViewOrderDialogProps) {
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
        // Prefer customer subject if available, otherwise fall back to lead.
        if (order.customerId) {
          const res = await fetch(`/api/customers/${order.customerId}`);
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = (await res.json()) as any;
          const nextSubjectId = (data as any)?.subject_id ?? null;
          if (!cancelled) {
            setSubjectId(nextSubjectId);
          }
          return;
        }

        const leadId = (order as any).lead_id as string | undefined;
        if (leadId) {
          const res = await fetch(`/api/leads/${leadId}`);
          if (!res.ok) {
            throw new Error(await res.text());
          }
          const data = (await res.json()) as any;
          const nextSubjectId = (data as any)?.subject_id ?? null;
          if (!cancelled) {
            setSubjectId(nextSubjectId);
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setSubjectError(
            typeof e?.message === "string" ? e.message : "Failed to resolve subject for this order",
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
  }, [open, order.customerId, order]);

  const amountLabel = formatINRMajor(order.amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Order {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Order details and subject level notes for this customer or lead.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Customer:</span>{" "}
              <span>{order.customerName || "Unknown"}</span>
            </div>
            <div>
              <span className="font-medium">Email:</span>{" "}
              <span className="text-muted-foreground">{order.email || "-"}</span>
            </div>
            <div>
              <span className="font-medium">Phone:</span>{" "}
              <span className="text-muted-foreground">{order.phone || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge variant="outline">{order.status}</Badge>
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">Amount:</span>{" "}
              <span>{amountLabel}</span>
            </div>
            <div>
              <span className="font-medium">Order date:</span>{" "}
              <span className="text-muted-foreground">
                {order.date ? new Date(order.date).toLocaleString() : "-"}
              </span>
            </div>
            <div>
              <span className="font-medium">Items:</span>{" "}
              <span className="text-muted-foreground">{order.items}</span>
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
            <div className="text-xs text-muted-foreground">Resolving subject for this order...</div>
          ) : null}
          <LeadNotesPanel subjectId={subjectId} />
          {!order.customerId && !(order as any).lead_id && (
            <div className="text-[11px] text-muted-foreground">
              Notes are linked to the underlying subject. Attach this order to a customer or lead to enable notes.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
