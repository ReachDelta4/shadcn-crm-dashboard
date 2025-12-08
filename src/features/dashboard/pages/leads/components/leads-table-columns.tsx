"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Lead, LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import { formatINRMajor } from "@/utils/currency";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { LeadActionsDropdown } from "./leads-actions-dropdown";

function canonicalize(status: LeadStatus): LeadStatus {
  return status;
}

export const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  disqualified: "bg-gray-200 text-gray-700",
  converted: "bg-emerald-100 text-emerald-800",
};

export const formatCurrency = (amount: number) => formatINRMajor(amount);

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
            {row.original.phone ? (
              <span className="text-xs text-muted-foreground">
                {row.original.phone}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "company",
        header: "Company",
        cell: ({ row }) => <div>{row.getValue("company")}</div>,
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
          const phone = row.original.phone;
          return <div>{phone || "—"}</div>;
        },
      },
      {
        accessorKey: "date",
        header: "Created",
        cell: ({ row }) => format(new Date(row.getValue("date")), "PPp"),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) =>
          row.original.updatedAt ? (
            <span className="text-xs text-muted-foreground">
              {format(new Date(row.original.updatedAt), "PPp")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
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
          const canonical = canonicalize(row.original.status);
          return (
            <div className="flex items-center gap-2">
              <Badge
                className={
                  statusColors[canonical] || "bg-gray-100 text-gray-700"
                }
              >
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
              {source
                .split("_")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </div>
          );
        },
      },
      {
        id: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const subjectId = row.original.subjectId;
          if (!subjectId) {
            return <span className="text-xs text-muted-foreground">None</span>;
          }
          return (
            <Link
              href={`/dashboard/leads/${row.original.id}#notes`}
              className="text-xs text-primary hover:underline"
            >
              View
            </Link>
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

