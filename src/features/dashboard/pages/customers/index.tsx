"use client";

import dynamic from "next/dynamic";
import { useCustomers } from "./hooks/use-customers";
import { CustomersFilters } from "./components/customers-filters";
import { Button } from "@/components/ui/button";
import { SavedViews } from "@/components/saved-views";
import { EntityTableShell } from "@/features/dashboard/components/entity-table-shell";

const CustomersTable = dynamic(
  () => import("./components/customers-table").then((m) => m.CustomersTable),
  {
    ssr: false,
    loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />,
  },
);

const NewCustomerDialog = dynamic(
  () => import("./components/new-customer-dialog").then((m) => m.NewCustomerDialog),
  { ssr: false },
);

export function CustomersPage() {
  const {
    customers,
    allCustomers,
    pageCount,
    filters,
    sorting,
    pagination,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    refetch,
  } = useCustomers();

  const isEmpty = allCustomers.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <EntityTableShell
        title="Customers"
        description="Manage your customer relationships and revenue."
        headerActions={
          <>
            <SavedViews
              entityKey="customers"
              getParams={() => ({ filters, sorting, pagination })}
              onApply={(params: any) => {
                if (params.filters) updateFilters(params.filters);
                if (params.sorting) handleSortingChange(params.sorting);
                if (params.pagination) handlePaginationChange(params.pagination);
              }}
            />
            <NewCustomerDialog onCreated={refetch} />
          </>
        }
        table={
          <div className="p-3">
            <div className="border-b pb-3 mb-3">
              <CustomersFilters filters={filters} onFiltersChange={updateFilters} />
            </div>
            <CustomersTable
              customers={customers}
              totalRows={allCustomers.length}
              sorting={sorting}
              onSort={handleSortingChange}
              pagination={pagination}
              onPaginationChange={handlePaginationChange}
              pageCount={pageCount}
            />
          </div>
        }
      />

      {isEmpty && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No customers found</h3>
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
