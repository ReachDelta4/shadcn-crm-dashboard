"use client";

import { useMemo } from "react";
import { Lead, LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { LeadActionsDropdown } from "./leads-actions-dropdown";

function canonicalize(status: LeadStatus): Exclude<LeadStatus, 'unqualified' | 'converted'> {
  if (status === 'unqualified') return 'lost'
  if (status === 'converted') return 'won'
  return status as any
}

export const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  demo_appointment: "bg-indigo-100 text-indigo-800",
  proposal_negotiation: "bg-amber-100 text-amber-800",
  invoice_sent: "bg-cyan-100 text-cyan-800",
  won: "bg-emerald-100 text-emerald-800",
  lost: "bg-gray-200 text-gray-700",
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const useLeadColumns = () => {
  return useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "leadNumber",
        header: "Lead ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("leadNumber")}</div>
        ),
      },
      {
        accessorKey: "fullName",
        header: "Contact",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span>{row.getValue("fullName")}</span>
            <span className="text-sm text-muted-foreground">
              {row.original.email}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => <div>{row.getValue("company")}</div>,
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => format(new Date(row.getValue("date")), "PPp"),
      },
      {
        accessorKey: "value",
        header: "Potential Value",
        cell: ({ row }) => formatCurrency(row.getValue("value")),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const canonical = canonicalize(row.original.status)
          return (
            <div className="flex items-center gap-2">
              <Badge className={statusColors[canonical] || "bg-gray-100 text-gray-700"}>
                {canonical.charAt(0).toUpperCase() + canonical.slice(1)}
              </Badge>
            </div>
          );
        },
      },
      // Removed inline status dropdown; use Kanban and actions for lifecycle changes
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
          const source = row.getValue("source") as string;
          return (
            <div>
              {source.split("_").map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(" ")}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <LeadActionsDropdown lead={row.original} />,
      },
    ],
    []
  );
}; 