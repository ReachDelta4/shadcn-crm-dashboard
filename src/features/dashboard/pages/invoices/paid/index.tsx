"use client";

import { useEffect } from "react";
import { InvoicesTable } from "@/features/dashboard/pages/invoices/components/invoices-table";
import { useInvoices } from "@/features/dashboard/pages/invoices/hooks/use-invoices";

export function PaidInvoicesPage() {
  const {
    invoices,
    allInvoices,
    pageCount,
    filters,
    sorting,
    pagination,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    refetch,
  } = useInvoices();

  // Force status filter to 'paid' on mount
  useEffect(() => {
    if (filters.status !== "paid") {
      updateFilters({ status: "paid" as any });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Paid Invoices</h1>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="p-3">
          <InvoicesTable
            invoices={invoices}
            totalRows={allInvoices.length}
            sorting={sorting}
            onSort={handleSortingChange}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            pageCount={pageCount}
          />
        </div>
      </div>
    </div>
  );
}