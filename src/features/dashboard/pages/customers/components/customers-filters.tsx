"use client";

import { CustomerFilters } from "@/features/dashboard/pages/customers/types/customer";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { DatePickerWithRange } from "@/components/shared/date-picker-with-range";

interface CustomersFiltersProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: Partial<CustomerFilters>) => void;
}

const statusOptions = [
  { label: "All Statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending" },
];

export function CustomersFilters({
  filters,
  onFiltersChange,
}: CustomersFiltersProps) {
  const handleClearSearch = () => {
    onFiltersChange({ search: "" });
  };

  const handleClearDateRange = () => {
    onFiltersChange({ dateRange: { from: undefined, to: undefined } });
  };

  const hasActiveFilters = filters.search || filters.status !== "all" || filters.dateRange.from || filters.dateRange.to;

  const handleClearAllFilters = () => {
    onFiltersChange({
      search: "",
      status: "all",
      dateRange: { from: undefined, to: undefined },
    });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search customers..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="pr-8"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Combobox
          value={filters.status}
          onChange={(value) => onFiltersChange({ status: (value as any) || "all" })}
          options={statusOptions}
          placeholder="Filter by status"
          className="w-[180px]"
        />

        <div className="relative">
          <DatePickerWithRange
            value={filters.dateRange}
            onChange={(dateRange) => onFiltersChange({ 
              dateRange: dateRange 
                ? { from: dateRange.from, to: dateRange.to }
                : { from: undefined, to: undefined }
            })}
          />
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0 hover:bg-red-100"
              onClick={handleClearDateRange}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" onClick={handleClearAllFilters}>
          Clear filters
        </Button>
      )}
    </div>
  );
} 