"use client";

import { useMemo } from "react";
import { Invoice, InvoiceStatus } from "@/features/dashboard/pages/invoices/types/invoice";
import { formatINRMajor } from "@/utils/currency";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { InvoiceActionsDropdown } from "./invoices-actions-dropdown";

const formatCurrency = (amount: number) => formatINRMajor(amount);

export const statusColors: Record<InvoiceStatus, string> = {
  draft: "bg-slate-100 text-slate-800",
  sent: "bg-indigo-100 text-indigo-800",
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
};

export const useInvoiceColumns = () => {
  return useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice Number",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("invoiceNumber")}</div>
        ),
      },
      {
        accessorKey: "customerName",
        header: "Customer",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.getValue("customerName")}</span>
            <span className="text-sm text-muted-foreground">
              {row.original.email}
            </span>
            {row.original.phone ? (
              <span className="text-xs text-muted-foreground">{row.original.phone}</span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "date",
        header: "Issue Date",
        cell: ({ row }) => format(new Date(row.getValue("date")), "PPp"),
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => format(new Date(row.getValue("dueDate")), "PPp"),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
          const created = row.original.createdAt || row.original.date;
          return (
            <span className="text-xs text-muted-foreground">
              {created ? format(new Date(created), "PPp") : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => {
          const updated = row.original.updatedAt || row.original.date;
          return (
            <span className="text-xs text-muted-foreground">
              {updated ? format(new Date(updated), "PPp") : "-"}
            </span>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.getValue("amount")),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as InvoiceStatus;
          return (
            <Badge className={statusColors[status]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          );
        },
      },
      {
        id: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const hasCustomer = row.original.customerId != null;
          return (
            <span className="text-xs text-muted-foreground">
              {hasCustomer ? "Linked" : "None"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <InvoiceActionsDropdown invoice={row.original} />,
      },
    ],
    []
  );
}; 
