"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useOrders } from "./hooks/use-orders";
import { OrdersTable } from "./components/orders-table";
import { OrdersFilters } from "./components/orders-filters";
import { Button } from "@/components/ui/button";
import { NewOrderDialog } from "./components/new-order-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewParam } from "@/hooks/use-view-param";
import { OrdersKanban } from "./components/orders-kanban";
import { SavedViews } from "@/components/saved-views";
import type { Order } from "@/features/dashboard/pages/orders/types/order";

export function OrdersPage({ initialOrders = [], initialCount = 0 }: { initialOrders?: Order[]; initialCount?: number }) {
  const {
    orders,
    allOrders,
    pageCount,
    filters,
    sorting,
    pagination,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    refetch,
  } = useOrders({ initialOrders, initialCount });

  const isEmpty = allOrders.length === 0;
  const { view, setView } = useViewParam("table");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
        <div className="flex items-center gap-2">
          <SavedViews
            entityKey="orders"
            getParams={() => ({ filters, sorting, pagination, view })}
            onApply={(params: any) => {
              if (params.filters) updateFilters(params.filters);
              if (params.sorting) handleSortingChange(params.sorting);
              if (params.pagination) handlePaginationChange(params.pagination);
              if (params.view) setView(params.view);
            }}
          />
          <NewOrderDialog onCreated={refetch} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <OrdersFilters filters={filters} onFiltersChange={updateFilters} />
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
            <OrdersTable
              orders={orders}
              totalRows={allOrders.length}
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
          <OrdersKanban orders={allOrders} onStatusChanged={refetch} />
        </div>
      )}

      {isEmpty && view === "table" && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No orders found</h3>
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
