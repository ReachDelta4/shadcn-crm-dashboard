export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customerName: string;
  email: string;
  phone?: string;
  amount: number;
  status: OrderStatus;
  date: string;
  items: number;
  paymentMethod: string;
  lead_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapOrderRecord(raw: any): Order {
  // If already shaped as an Order, return as-is.
  if (raw && raw.orderNumber !== undefined && raw.customerName !== undefined) {
    return raw as Order;
  }

  const nowIso = new Date().toISOString();

  const normalizeNumber = (value: any, fallback: number): number => {
    if (typeof value === "number") return value;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const date = raw?.date || nowIso;

  const createdAt =
    raw?.created_at ||
    raw?.createdAt ||
    date ||
    nowIso;

  const updatedAt =
    raw?.updated_at ||
    raw?.updatedAt ||
    date ||
    createdAt ||
    nowIso;

  return {
    id: raw?.id || "",
    orderNumber: raw?.order_number || raw?.orderNumber || "",
    customerId: raw?.customer_id ?? raw?.customerId ?? null,
    customerName: raw?.customer_name || raw?.customerName || "",
    email: raw?.email || "",
    phone: raw?.phone || "",
    amount: normalizeNumber(raw?.amount, 0),
    status: (raw?.status || "pending") as OrderStatus,
    date,
    items: normalizeNumber(raw?.items, 0),
    paymentMethod: raw?.payment_method || raw?.paymentMethod || "card",
    lead_id: raw?.lead_id || raw?.leadId || undefined,
    createdAt,
    updatedAt,
  };
}

export interface OrderFilters {
  status: OrderStatus | 'all';
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
} 
