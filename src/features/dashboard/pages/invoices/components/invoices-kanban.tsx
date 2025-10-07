"use client";

import * as React from "react";
import { Invoice, InvoiceStatus } from "../types/invoice";
import { formatINRMajor } from "@/utils/currency";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

const COLUMNS: { key: InvoiceStatus; title: string }[] = [
  { key: "draft", title: "Draft" },
  { key: "sent", title: "Sent" },
  { key: "pending", title: "Pending" },
  { key: "paid", title: "Paid" },
  { key: "overdue", title: "Overdue" },
  { key: "cancelled", title: "Cancelled" },
];

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, string> = {
    draft: "bg-gray-100 text-gray-800",
    sent: "bg-indigo-100 text-indigo-800",
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-emerald-100 text-emerald-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-slate-200 text-slate-700",
  };
  return <Badge className={map[status]}>{status}</Badge>;
}

export function InvoicesKanban({ invoices, onStatusChanged }: { invoices: Invoice[]; onStatusChanged?: () => void }) {
  const [items, setItems] = React.useState<Invoice[]>(invoices);
  React.useEffect(() => setItems(invoices), [invoices]);

  const updateStatus = async (invoice: Invoice, next: InvoiceStatus) => {
    if (invoice.status === next) return;
    const prev = items;
    setItems((arr) => arr.map((i) => (i.id === invoice.id ? { ...i, status: next } : i)));
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Invoice updated");
      onStatusChanged?.();
    } catch (e) {
      setItems(prev);
      toast.error("Failed to update invoice");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const colItems = items.filter((i) => i.status === col.key);
        return (
          <Card key={col.key} aria-label={`${col.title} column`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {col.title}
                <span className="text-muted-foreground ml-2 text-xs">{colItems.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {colItems.length === 0 ? (
                <div className="text-muted-foreground text-xs">No invoices</div>
              ) : (
                colItems.map((invoice) => (
                  <div key={invoice.id} className="rounded-md border p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">#{invoice.invoiceNumber} — {invoice.customerName}</div>
                        <div className="text-muted-foreground truncate text-xs">{invoice.email}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Invoice actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Move to</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {COLUMNS.map((c) => (
                            <DropdownMenuItem key={c.key} onClick={() => updateStatus(invoice, c.key)} aria-label={`Move to ${c.title}`}>
                              {c.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <StatusBadge status={invoice.status} />
                      <span className="tabular-nums">{formatINRMajor(invoice.amount)}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
