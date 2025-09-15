"use client";

import {
  LeadFilters,
  LeadStatus,
} from "@/features/dashboard/pages/leads/types/lead";
import { Input } from "@/components/ui/input";
import { DatePickerWithRange } from "@/components/shared/date-picker-with-range";
import { Search } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

interface LeadsFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: Partial<LeadFilters>) => void;
}

const STATUS_OPTIONS: { label: string; value: LeadStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Unqualified", value: "unqualified" },
  { label: "Converted", value: "converted" },
];

export function LeadsFilters({
  filters,
  onFiltersChange,
}: LeadsFiltersProps) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search leads..."
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
                : { from: undefined, to: undefined },
            })
          }
        />
      </div>
    </div>
  );
} 