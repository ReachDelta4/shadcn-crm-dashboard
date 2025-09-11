import { useState, useMemo, useEffect, useCallback } from "react";
import { Lead, LeadFilters } from "@/features/dashboard/pages/leads/types/lead";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";

interface UseLeadsProps {
  initialLeads?: Lead[];
}

interface ApiResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useLeads({ initialLeads = [] }: UseLeadsProps = {}) {
  const [filters, setFilters] = useState<LeadFilters>({
    status: "all",
    search: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.dateRange.from) params.set('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.set('dateTo', filters.dateRange.to.toISOString());

      if (sorting.length > 0) {
        const sort = sorting[0];
        let sortField = sort.id;
        if (sortField === 'date') sortField = 'date';
        if (sortField === 'fullName') sortField = 'full_name';
        if (sortField === 'leadNumber') sortField = 'lead_number';
        params.set('sort', sortField);
        params.set('direction', sort.desc ? 'desc' : 'asc');
      }

      const response = await fetch(`/api/leads?${params}`);
      if (!response.ok) throw new Error(`Failed to fetch leads: ${response.statusText}`);
      const result: ApiResponse = await response.json();

      const transformed: Lead[] = (result.data || []).map((lead: any) => ({
        id: lead.id || '',
        leadNumber: lead.lead_number || lead.leadNumber || '',
        fullName: lead.full_name || lead.fullName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        value: typeof lead.value === 'number' ? lead.value : 0,
        status: (lead.status || 'new') as any,
        date: lead.date || new Date().toISOString(),
        source: lead.source || 'unknown',
      }));

      setLeads(transformed);
      setTotalCount(result.count || 0);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
      setLeads([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sorting, pagination]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const updateFilters = (newFilters: Partial<LeadFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    setSorting(
      updaterOrValue instanceof Function
        ? updaterOrValue(sorting)
        : updaterOrValue
    );
  };

  const handlePaginationChange: OnChangeFn<PaginationState> = (
    updaterOrValue
  ) => {
    setPagination(
      updaterOrValue instanceof Function
        ? updaterOrValue(pagination)
        : updaterOrValue
    );
  };

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      search: "",
      dateRange: { from: undefined, to: undefined },
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  return {
    allLeads: leads,
    leads,
    pageCount,
    filters,
    sorting,
    pagination,
    loading,
    error,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    refetch: fetchLeads,
  };
} 