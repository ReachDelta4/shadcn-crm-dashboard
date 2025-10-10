import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Order, OrderFilters } from "@/features/dashboard/pages/orders/types/order";
import {
  SortingState,
  PaginationState,
  OnChangeFn,
} from "@tanstack/react-table";

interface UseOrdersProps {
  initialOrders?: Order[];
  initialCount?: number;
}

interface ApiResponse {
  data: any[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function useOrders({ initialOrders = [], initialCount = 0 }: UseOrdersProps = {}) {
  const [filters, setFilters] = useState<OrderFilters>({
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

  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipFirstFetchRef = useRef<boolean>(initialOrders.length > 0 || initialCount > 0);

  const fetchOrders = useCallback(async () => {
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
        if (sortField === 'customerName') sortField = 'customer_name';
        if (sortField === 'orderNumber') sortField = 'order_number';
        params.set('sort', sortField);
        params.set('direction', sort.desc ? 'desc' : 'asc');
      }

      const response = await fetch(`/api/orders?${params}`);
      if (!response.ok) throw new Error(`Failed to fetch orders: ${response.statusText}`);
      const result: ApiResponse = await response.json();

      const transformed: Order[] = (result.data || []).map((order: any) => ({
        id: order.id || '',
        orderNumber: order.order_number || order.orderNumber || '',
        customerName: order.customer_name || order.customerName || '',
        email: order.email || '',
        phone: order.phone || '',
        amount: typeof order.amount === 'number' ? order.amount : 0,
        status: (order.status || 'pending') as any,
        date: order.date || new Date().toISOString(),
        items: typeof order.items === 'number' ? order.items : 0,
        paymentMethod: order.payment_method || 'card',
        lead_id: order.lead_id || undefined,
      }));

      setOrders(transformed);
      setTotalCount(result.count || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
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
    fetchOrders();
  }, [fetchOrders]);

  const updateFilters = (newFilters: Partial<OrderFilters>) => {
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
    allOrders: orders,
    orders,
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
    refetch: fetchOrders,
  };
}
