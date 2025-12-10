"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useLeads } from "./hooks/use-leads";
import { LeadsFilters } from "./components/leads-filters";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViewParam } from "@/hooks/use-view-param";
import { SavedViews } from "@/components/saved-views";
import { EntityTableShell } from "@/features/dashboard/components/entity-table-shell";
import type { Lead } from "@/features/dashboard/pages/leads/types/lead";
import { usePerfTimer } from "@/lib/perf";

const LeadsTable = dynamic(() => import("./components/leads-table").then(m => m.LeadsTable), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />,
});

const LeadsKanban = dynamic(() => import("./components/leads-kanban").then(m => m.LeadsKanban), {
  ssr: false,
  loading: () => <div className="h-80 w-full animate-pulse rounded-lg bg-muted" />,
});

const NewLeadDialog = dynamic(() => import("./components/new-lead-dialog").then(m => m.NewLeadDialog), {
  ssr: false,
});

export function LeadsPage({ initialLeads = [], initialCount = 0 }: { initialLeads?: Lead[]; initialCount?: number }) {
  const {
    leads,
    allLeads,
    pageCount,
    filters,
    sorting,
    pagination,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    refetch,
  } = useLeads({ initialLeads, initialCount });

  const isEmpty = allLeads.length === 0;
  const { view, setView } = useViewParam("table");
  const perf = usePerfTimer("component:dashboard/leads", {
    autoReadyTimeoutMs: 3000,
  });

  React.useEffect(() => {
    if (!perf.enabled) return;
    if (!isEmpty || !leads || leads.length >= 0) {
      perf.markReady({
        totalLeads: allLeads.length,
        view,
      });
    } else {
      perf.markReady({
        totalLeads: allLeads.length,
        view,
        loadingFallback: true,
      });
    }
  }, [perf, allLeads.length, view, leads, isEmpty]);

  return (
    <div className="flex flex-col gap-4">
      <EntityTableShell
        title="Leads"
        description="Manage your pipeline of prospects."
        headerActions={
          <>
            <SavedViews
              entityKey="leads"
              getParams={() => ({ filters, sorting, pagination, view })}
              onApply={(params: any) => {
                if (params.filters) updateFilters(params.filters);
                if (params.sorting) handleSortingChange(params.sorting);
                if (params.pagination) handlePaginationChange(params.pagination);
                if (params.view) setView(params.view);
              }}
            />
            <NewLeadDialog onCreated={refetch} />
          </>
        }
        table={
          view === "table" ? (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <LeadsFilters filters={filters} onFiltersChange={updateFilters} />
                <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                  <TabsList>
                    <TabsTrigger value="table">Table</TabsTrigger>
                    <TabsTrigger value="kanban">Kanban</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <LeadsTable
                leads={leads}
                totalRows={allLeads.length}
                sorting={sorting}
                onSort={handleSortingChange}
                pagination={pagination}
                onPaginationChange={handlePaginationChange}
                pageCount={pageCount}
              />
            </div>
          ) : (
            <div className="p-3">
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList>
                  <TabsTrigger value="table">Table</TabsTrigger>
                  <TabsTrigger value="kanban">Kanban</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="mt-4 rounded-lg border bg-card p-3">
                <LeadsKanban leads={allLeads} onStatusChanged={refetch} />
              </div>
            </div>
          )
        }
      />

      {isEmpty && view === "table" && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 className="mt-4 text-lg font-semibold">No leads found</h3>
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
