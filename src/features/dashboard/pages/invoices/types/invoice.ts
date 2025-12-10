export type InvoiceStatus = 'draft' | 'sent' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string | null;
  customerName: string;
  email: string;
  phone?: string;
  amount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  items: number;
  paymentMethod: string;
  createdAt?: string;
  updatedAt?: string;
}

export function mapInvoiceRecord(raw: any): Invoice {
  // If already shaped as an Invoice, return as-is to keep things simple.
  if (raw && raw.invoiceNumber !== undefined && raw.customerName !== undefined) {
    return raw as Invoice;
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
    invoiceNumber: raw?.invoice_number || raw?.invoiceNumber || "",
    customerId: raw?.customer_id ?? raw?.customerId ?? null,
    customerName: raw?.customer_name || raw?.customerName || "",
    email: raw?.email || "",
    phone: raw?.phone || "",
    amount: normalizeNumber(raw?.amount, 0),
    status: (raw?.status || "draft") as InvoiceStatus,
    date,
    dueDate: raw?.due_date || raw?.dueDate || nowIso,
    items: normalizeNumber(raw?.items, 0),
    paymentMethod: raw?.payment_method || raw?.paymentMethod || "card",
    createdAt,
    updatedAt,
  };
}

export interface InvoiceFilters {
  status: InvoiceStatus | 'all';
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
} 
