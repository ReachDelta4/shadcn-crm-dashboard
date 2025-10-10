export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone?: string;
  amount: number;
  status: OrderStatus;
  date: string;
  items: number;
  paymentMethod: string;
  lead_id?: string;
}

export interface OrderFilters {
  status: OrderStatus | 'all';
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
} 