import { useState, useMemo, useEffect, useCallback } from "react";
import { Customer, CustomerFilters } from "@/features/dashboard/pages/customers/types/customer";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";

interface UseCustomersProps {
  initialCustomers?: Customer[];
}

interface ApiResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useCustomers({ initialCustomers = [] }: UseCustomersProps = {}) {
  const [filters, setFilters] = useState<CustomerFilters>({
    status: "all",
    search: "",
    dateRange: {
      from: undefined,
      to: undefined,
    },
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "dateJoined", desc: true },
  ]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
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

      // Convert TanStack sorting to API format
      if (sorting.length > 0) {
        const sort = sorting[0];
        let sortField = sort.id;
        
        // Map frontend field names to backend field names
        if (sortField === 'dateJoined') sortField = 'date_joined';
        if (sortField === 'fullName') sortField = 'full_name';
        if (sortField === 'customerNumber') sortField = 'customer_number';
        
        params.set('sort', sortField);
        params.set('direction', sort.desc ? 'desc' : 'asc');
      }

      const response = await fetch(`/api/customers?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const result: ApiResponse = await response.json();
      
      // Transform API data to match frontend Customer type with safe property access
      const transformedCustomers: Customer[] = (result.data || []).map((customer: any) => ({
        id: customer.id || '',
        customerNumber: customer.customer_number || customer.customerNumber || '',
        fullName: customer.full_name || customer.fullName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        location: customer.location || '',
        status: (customer.status || 'active') as 'active' | 'inactive' | 'pending',
        dateJoined: customer.date_joined || customer.dateJoined || new Date().toISOString(),
        createdAt: customer.created_at || customer.createdAt || new Date().toISOString(),
        updatedAt: customer.updated_at || customer.updatedAt || new Date().toISOString(),
      }));

      setCustomers(transformedCustomers);
      setTotalCount(result.count || 0);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      setCustomers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [filters, sorting, pagination]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const updateFilters = (newFilters: Partial<CustomerFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    // Reset to first page when filters change
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
    // Raw filtered customers (for compatibility)
    allCustomers: customers,
    // Customers with pagination and sorting applied (same as above since API handles it)
    customers: customers,
    // Total count for pagination
    pageCount,
    // States
    filters,
    sorting,
    pagination,
    loading,
    error,
    // Update handlers
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    // Refresh function
    refetch: fetchCustomers,
  };
} 