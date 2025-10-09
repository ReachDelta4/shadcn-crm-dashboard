import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Invoice, InvoiceFilters } from "@/features/dashboard/pages/invoices/types/invoice";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";

interface UseInvoicesProps {
  initialInvoices?: Invoice[];
  initialCount?: number;
}

interface ApiResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useInvoices({ initialInvoices = [], initialCount = 0 }: UseInvoicesProps = {}) {
  const [filters, setFilters] = useState<InvoiceFilters>({
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

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const skipFirstFetchRef = useRef<boolean>(initialInvoices.length > 0 || initialCount > 0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        pageSize: pagination.pageSize.toString(),
      });

      if (filters.search) params.set('search', filters.search);
      if (filters.status && filters.status !== 'all') params.set('status', filters.status);
      if (filters.dateRange.from) params.set('dateFrom', filters.dateRange.from.toISOString());
      if (filters.dateRange.to) params.set('dateTo', filters.dateRange.to.toISOString());

      if ((sorting as SortingState).length > 0) {
        const sort = (sorting as SortingState)[0];
        let sortField = sort.id;
        if (sortField === 'date') sortField = 'date';
        if (sortField === 'customerName') sortField = 'customer_name';
        if (sortField === 'invoiceNumber') sortField = 'invoice_number';
        params.set('sort', sortField);
        params.set('direction', sort.desc ? 'desc' : 'asc');
      }

      const response = await fetch(`/api/invoices?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error(`Failed to fetch invoices: ${response.statusText}`);
      const result: ApiResponse = await response.json();

      const transformed: Invoice[] = (result.data || []).map((invoice: any) => ({
        id: invoice.id || '',
        invoiceNumber: invoice.invoice_number || invoice.invoiceNumber || '',
        customerName: invoice.customer_name || invoice.customerName || '',
        email: invoice.email || '',
        phone: invoice.phone || '',
        amount: typeof invoice.amount === 'number' ? invoice.amount : 0,
        status: (invoice.status || 'draft') as any,
        date: invoice.date || new Date().toISOString(),
        dueDate: invoice.due_date || invoice.dueDate || new Date().toISOString(),
        items: typeof invoice.items === 'number' ? invoice.items : 0,
        paymentMethod: invoice.payment_method || 'card',
      }));

      setInvoices(transformed);
      setTotalCount(result.count || 0);
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        // Swallow abort errors silently
        return;
      }
      console.error('Failed to fetch invoices:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      setInvoices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sorting, pagination]);

  useEffect(() => {
    if (skipFirstFetchRef.current) {
      skipFirstFetchRef.current = false;
      return;
    }
    fetchInvoices();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchInvoices]);

  const updateFilters = (newFilters: Partial<InvoiceFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    setSorting(
      updaterOrValue instanceof Function
        ? updaterOrValue(sorting as SortingState)
        : (updaterOrValue as SortingState)
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
    allInvoices: invoices,
    invoices,
    pageCount,
    filters,
    sorting: (sorting as SortingState),
    pagination,
    loading,
    error,
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    refetch: fetchInvoices,
  };
} 