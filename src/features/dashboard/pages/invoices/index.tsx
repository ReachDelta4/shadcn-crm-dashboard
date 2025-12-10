"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useInvoices } from "./hooks/use-invoices";
import { InvoicesFilters } from "./components/invoices-filters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewParam } from "@/hooks/use-view-param";
import { SavedViews } from "@/components/saved-views";
import type { Invoice } from "@/features/dashboard/pages/invoices/types/invoice";

const InvoicesTable = dynamic(() => import("./components/invoices-table").then(m => m.InvoicesTable), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />,
});

const InvoicesKanban = dynamic(() => import("./components/invoices-kanban").then(m => m.InvoicesKanban), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-lg bg-muted" />,
});

const NewInvoiceDialogV2 = dynamic(() => import("./components/new-invoice-dialog-v2").then(m => m.NewInvoiceDialogV2), {
  ssr: false,
});

export function InvoicesPage({ initialInvoices = [], initialCount = 0 }: { initialInvoices?: Invoice[]; initialCount?: number }) {
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
    handleClearFilters,
    refetch,
  } = useInvoices({ initialInvoices, initialCount });

  const isEmpty = allInvoices.length === 0;
  const { view, setView } = useViewParam("table");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">All Invoices</h1>
        <div className="flex items-center gap-2">
          <SavedViews
            entityKey="invoices"
            getParams={() => ({ filters, sorting, pagination, view })}
            onApply={(params: any) => {
              if (params.filters) updateFilters(params.filters);
              if (params.sorting) handleSortingChange(params.sorting);
              if (params.pagination) handlePaginationChange(params.pagination);
              if (params.view) setView(params.view);
            }}
          />
          <NewInvoiceDialogV2 onCreated={refetch} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <InvoicesFilters filters={filters} onFiltersChange={updateFilters} />
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {view === "table" && (
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
      )}

      {view === "kanban" && (
        <div className="rounded-lg border bg-card p-3">
          <InvoicesKanban invoices={allInvoices} onStatusChanged={refetch} />
        </div>
      )}

      {isEmpty && view === "table" && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No invoices found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filter to find what you are looking
              for.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
