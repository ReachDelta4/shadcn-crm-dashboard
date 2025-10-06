"use client";

import {
  InvoiceFilters,
  InvoiceStatus,
} from "@/features/dashboard/pages/invoices/types/invoice";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
const DatePickerWithRange = dynamic(() => import("@/components/shared/date-picker-with-range").then(m => m.DatePickerWithRange), { loading: () => null });
import { Search } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface InvoicesFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: Partial<InvoiceFilters>) => void;
}

const STATUS_OPTIONS: { label: string; value: InvoiceStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Sent", value: "sent" },
  { label: "Pending", value: "pending" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Cancelled", value: "cancelled" },
];

export function InvoicesFilters({
  filters,
  onFiltersChange,
}: InvoicesFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search invoices..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <Combobox
          value={filters.status}
          onChange={(value) => onFiltersChange({ status: (value as any) || "all" })}
          options={STATUS_OPTIONS}
          placeholder="Filter by status"
          className="w-full md:w-[180px]"
        />
        <DatePickerWithRange
          className="w-full md:w-auto"
          value={{
            from: filters.dateRange.from,
            to: filters.dateRange.to,
          }}
          onChange={(dateRange) =>
            onFiltersChange({
              dateRange: dateRange
                ? { from: dateRange.from, to: dateRange.to }
                : undefined,
            })
          }
        />
      </div>
    </div>
  );
} 