export interface RevenueData {
  period: string;
  total_revenue_minor: number;
  sources?: {
    payment_schedules?: number;
    recurring_revenue?: number;
    one_time_invoices?: number;
  };
}

export interface RevenueKpis {
  realized_total_minor: number;
  pending_total_minor: number;
  draft_total_minor: number;
  lead_potential_minor: number;
  gross_profit_minor: number;
  gross_margin_percent: number;
}

export interface RevenueQueryParams {
  groupBy: "month" | "week" | "day";
  from?: Date;
  to?: Date;
}

export interface RevenueResponseNormalized {
  revenue: RevenueData[];
  kpis: RevenueKpis;
}

export function buildRevenueQueryParams(params: RevenueQueryParams) {
  const qs = new URLSearchParams({ groupBy: params.groupBy });
  if (params.from) qs.set("from", params.from.toISOString());
  if (params.to) qs.set("to", params.to.toISOString());
  return qs;
}

export function normalizeRevenueResponse(response: any): RevenueResponseNormalized {
  const kpis: RevenueKpis = {
    realized_total_minor: response?.realized_total_minor ?? 0,
    pending_total_minor: response?.pending_total_minor ?? 0,
    draft_total_minor: response?.draft_total_minor ?? 0,
    lead_potential_minor: response?.lead_potential_minor ?? 0,
    gross_profit_minor: response?.gross_profit_minor ?? 0,
    gross_margin_percent: response?.gross_margin_percent ?? 0,
  };

  const revenue: RevenueData[] = Array.isArray(response?.revenue)
    ? response.revenue
    : [];

  return { revenue, kpis };
}

export async function fetchRevenueReport(params: RevenueQueryParams): Promise<RevenueResponseNormalized> {
  const qs = buildRevenueQueryParams(params);
  const response = await fetch(`/api/reports/revenue?${qs.toString()}`);
  if (!response.ok) throw new Error(`Failed to fetch revenue: ${response.statusText}`);
  const json = await response.json();
  return normalizeRevenueResponse(json);
}
