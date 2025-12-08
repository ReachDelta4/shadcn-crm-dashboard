"use client";

import { useMemo } from "react";
import { Customer, CustomerStatus } from "@/features/dashboard/pages/customers/types/customer";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";
import { CustomerActionsDropdown } from "./customers-actions-dropdown";

export const statusColors: Record<CustomerStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  churned: "bg-red-100 text-red-800",
};

export const useCustomerColumns = () => {
  return useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: "customerNumber",
        header: "Customer ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("customerNumber")}</div>
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
        cell: ({ row }) => <div>{row.getValue("company") || "-"}</div>,
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => <div>{row.getValue("phone") || "-"}</div>,
      },
      {
        accessorKey: "location",
        header: "Location",
        cell: ({ row }) => <div>{row.getValue("location") || "-"}</div>,
      },
      {
        accessorKey: "dateJoined",
        header: "Date Joined",
        cell: ({ row }) => format(new Date(row.getValue("dateJoined")), "PP"),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.updatedAt), "PP")}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.getValue("status") as CustomerStatus;
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
          const subjectId = row.original.subjectId ?? null;
          if (!subjectId) {
            return <span className="text-xs text-muted-foreground">None</span>;
          }
          return (
            <span className="text-xs text-primary">
              Linked
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <CustomerActionsDropdown customer={row.original} />,
      },
    ],
    []
  );
};

