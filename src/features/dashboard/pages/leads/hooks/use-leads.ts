import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import {
  Lead,
  LeadFilters,
  LeadStatus,
} from "@/features/dashboard/pages/leads/types/lead";
import { useDebouncedValue } from "@/utils/hooks/useDebouncedValue";
import { debounce } from "@/utils/timing/debounce";

interface UseLeadsProps {
  initialLeads?: Lead[];
  initialCount?: number;
}

interface ApiResponse {
  data: any[];
  count: number;
}

const sortFieldMap: Record<string, string> = {
  date: "date",
  fullName: "full_name",
  leadNumber: "lead_number",
};

export function buildLeadsQueryKey(
  pagination: PaginationState,
  filters: LeadFilters,
  sorting: SortingState
) {
  const primarySort = sorting[0] ?? { id: "date", desc: true };

  return [
    "leads",
    {
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      search: (filters.search || "").trim(),
      status: filters.status,
      dateFrom: filters.dateRange.from
        ? filters.dateRange.from.toISOString()
        : undefined,
      dateTo: filters.dateRange.to
        ? filters.dateRange.to.toISOString()
        : undefined,
      sortId: primarySort.id,
      sortDesc: !!primarySort.desc,
    },
  ] as const;
}

export function buildLeadsQueryParams(
  pagination: PaginationState,
  filters: LeadFilters,
  sorting: SortingState
) {
  const params = new URLSearchParams({
    page: pagination.pageIndex.toString(),
    pageSize: pagination.pageSize.toString(),
  });

  const search = filters.search?.trim();
  if (search) params.set("search", search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.dateRange.from) params.set("dateFrom", filters.dateRange.from.toISOString());
  if (filters.dateRange.to) params.set("dateTo", filters.dateRange.to.toISOString());

  if (sorting.length > 0) {
    const sort = sorting[0];
    const sortField = sortFieldMap[sort.id] || sort.id;
    params.set("sort", sortField);
    params.set("direction", sort.desc ? "desc" : "asc");
  }

  return params;
}

export function mapLeadRecord(raw: any): Lead {
  const fallbackDate = new Date().toISOString();
  const status = (raw?.status || "new") as LeadStatus;

  const normalizeNumber = (value: any) => {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return {
    id: raw?.id || "",
    leadNumber: raw?.lead_number || raw?.leadNumber || "",
    subjectId: raw?.subject_id ?? raw?.subjectId ?? null,
    fullName: raw?.full_name || raw?.fullName || "",
    email: raw?.email || "",
    phone: raw?.phone || "",
    company: raw?.company || "",
    value: normalizeNumber(raw?.value),
    status,
    date: raw?.date || fallbackDate,
    updatedAt: raw?.updated_at || raw?.updatedAt || raw?.date || fallbackDate,
    source: raw?.source || "unknown",
  };
}

export function useLeads({ initialLeads = [], initialCount = 0 }: UseLeadsProps = {}) {
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

  const debouncedSearch = useDebouncedValue(filters.search, 250);

  const effectiveFilters: LeadFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: buildLeadsQueryKey(pagination, effectiveFilters, sorting),
    queryFn: async ({ signal }) => {
      const params = buildLeadsQueryParams(pagination, effectiveFilters, sorting);
      const response = await fetch(`/api/leads?${params.toString()}`, {
        signal: signal as AbortSignal | undefined,
      });
      if (!response.ok) throw new Error(`Failed to fetch leads: ${response.statusText}`);
      return response.json() as Promise<ApiResponse>;
    },
    select: (response) => ({
      data: (response?.data || []).map(mapLeadRecord),
      count: response?.count || 0,
    }),
    placeholderData: keepPreviousData,
    initialData: initialLeads.length > 0 ? { data: initialLeads, count: initialCount } : undefined,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const leads: Lead[] = data?.data || initialLeads;
  const totalCount = data?.count ?? initialCount;

  useEffect(() => {
    const onChanged = debounce(() => {
      refetch();
    }, 150);
    window.addEventListener("leads:changed", onChanged);
    return () => window.removeEventListener("leads:changed", onChanged);
  }, [refetch]);

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

  const pageCount = totalCount > 0 ? Math.ceil(totalCount / pagination.pageSize) : 0;

  return {
    allLeads: leads,
    leads,
    pageCount,
    filters,
    sorting,
    pagination,
    loading: isLoading,
    error: isError ? (error as Error).message : null,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    refetch,
  };
}
