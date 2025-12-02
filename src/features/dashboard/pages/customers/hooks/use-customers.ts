import { useState, useEffect } from "react";
import { Customer, CustomerFilters } from "@/features/dashboard/pages/customers/types/customer";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

interface UseCustomersProps {
  initialCustomers?: Customer[];
  initialCount?: number;
}

interface ApiResponse {
  data: any[];
  count: number;
}

export function useCustomers({ initialCustomers = [], initialCount = 0 }: UseCustomersProps = {}) {
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

  const fetchCustomers = async () => {
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

    return response.json() as Promise<ApiResponse>;
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['customers', pagination, filters, sorting],
    queryFn: fetchCustomers,
    placeholderData: keepPreviousData,
    initialData: initialCustomers.length > 0 ? { data: initialCustomers, count: initialCount } as any : undefined,
  });

  // Transform API data to match frontend Customer type with safe property access
  const customers: Customer[] = (data?.data || []).map((customer: any) => {
    // If it's already a Customer object (from initialData), return it
    if (customer.customerNumber !== undefined && customer.fullName !== undefined) return customer;

    return {
      id: customer.id || '',
      customerNumber: customer.customer_number || customer.customerNumber || '',
      fullName: customer.full_name || customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      company: customer.company || '',
      location: customer.location || '',
      // Preserve exact status from API; allow 'churned'
      status: (customer.status || 'pending') as 'active' | 'inactive' | 'pending' | 'churned',
      dateJoined: customer.date_joined || customer.dateJoined || new Date().toISOString(),
      createdAt: customer.created_at || customer.createdAt || new Date().toISOString(),
      updatedAt: customer.updated_at || customer.updatedAt || new Date().toISOString(),
    };
  });

  const totalCount = data?.count || initialCount;

  // Fetch data when dependencies change - handled by useQuery
  // Listen for global events to refetch
  useEffect(() => {
    const onChanged = () => { refetch(); };
    window.addEventListener('customers:changed', onChanged);
    return () => window.removeEventListener('customers:changed', onChanged);
  }, [refetch]);

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
    loading: isLoading,
    error: isError ? (error as Error).message : null,
    // Update handlers
    updateFilters,
    handleSortingChange,
    handlePaginationChange,
    handleClearFilters,
    // Refresh function
    refetch,
  };
} 
