"use client";

import { useEffect, useMemo, useState } from "react";
import { InvoicesFilters } from "../components/invoices-filters";
import { useInvoices } from "../hooks/use-invoices";
import { InvoicesTable } from "../components/invoices-table";
import { Button } from "@/components/ui/button";
import { debounce } from "@/utils/timing/debounce";

export function PendingInvoicesPage() {
  const { invoices, filters, updateFilters, refetch, loading, pageCount, pagination, handlePaginationChange, sorting, handleSortingChange } = useInvoices({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Force status filter to pending/sent/overdue scope for this page
    if (!initialized) {
      updateFilters({ status: "pending" as any });
      setInitialized(true);
    }
  }, [initialized, updateFilters]);

  // Filter client-side to show only pending/sent/overdue in case backend returns broader set
  const scoped = useMemo(() => {
    const allowed = new Set(["pending","sent","overdue"]);
    return (invoices || []).filter((i: any) => allowed.has((i.status || '').toString()));
  }, [invoices]);

  useEffect(() => {
    const onChanged = debounce(() => {
      refetch();
    }, 150);
    window.addEventListener('invoices:changed', onChanged);
    return () => window.removeEventListener('invoices:changed', onChanged);
  }, [refetch]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Pending Invoices</h1>
        <Button variant="outline" onClick={() => refetch()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
      </div>

      <InvoicesFilters filters={filters as any} onFiltersChange={updateFilters} />

      <InvoicesTable 
        invoices={scoped as any}
        totalRows={scoped.length}
        sorting={sorting as any}
        onSort={handleSortingChange as any}
        pagination={pagination as any}
        onPaginationChange={handlePaginationChange}
        pageCount={pageCount}
      />
    </div>
  );
} 
