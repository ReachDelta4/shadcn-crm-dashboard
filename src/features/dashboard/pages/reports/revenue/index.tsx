"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatINRMinor } from "@/utils/currency";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";
import { fetchRevenueReport, RevenueData, RevenueKpis } from "./query";

const emptyKpis: RevenueKpis = {
  realized_total_minor: 0,
  realized_net_revenue_minor: 0,
  realized_tax_minor: 0,
  pending_total_minor: 0,
   pending_net_revenue_minor: 0,
   pending_tax_minor: 0,
  draft_total_minor: 0,
  lead_potential_minor: 0,
  gross_profit_minor: 0,
  gross_margin_percent: 0,
};

export function RevenueReportPage() {
  const [groupBy, setGroupBy] = useState<"month" | "week" | "day">("month");
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const queryParams = useMemo(
    () => ({
      groupBy,
      from: range?.from,
      to: range?.to,
    }),
    [groupBy, range],
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["reports", "revenue", queryParams],
    queryFn: () => fetchRevenueReport(queryParams),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const revenue = useMemo(() => data?.revenue ?? [], [data]);
  const kpis = useMemo(() => data?.kpis ?? emptyKpis, [data]);
  const loading = isLoading || isFetching;
  const errorMessage = isError ? (queryError as Error)?.message || "Failed to fetch revenue" : null;

  const totalRevenue = useMemo(
    () => revenue.reduce((sum, r) => sum + (r.total_revenue_minor || 0), 0),
    [revenue],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="text-2xl font-bold tracking-tight">Revenue Report</h1>
        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="day">Daily</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker value={range} onChange={setRange} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Total Revenue"
          value={formatCurrency(kpis.realized_total_minor)}
          description="Realized revenue (gross, incl. tax)"
        />
        <KpiCard
          title="Tax Collected"
          value={formatCurrency(kpis.realized_tax_minor)}
          description="Recognized tax on realized revenue"
        />
        <KpiCard title="Gross Profit" value={formatCurrency(kpis.gross_profit_minor)} description="Revenue - COGS" />
        <KpiCard title="Gross Margin" value={`${kpis.gross_margin_percent.toFixed(1)}%`} description="Profit / Revenue" />
        <KpiCard title="Pending Revenue" value={formatCurrency(kpis.pending_total_minor)} description="Sent/Pending/Overdue" />
        <KpiCard title="Draft Value" value={formatCurrency(kpis.draft_total_minor)} description="Draft invoices" />
        <KpiCard title="Potential Revenue" value={formatCurrency(kpis.lead_potential_minor)} description="Open leads' value" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Period</CardTitle>
        </CardHeader>
        <CardContent>
          {errorMessage ? (
            <div className="flex items-center justify-center py-8 text-sm text-red-600">
              {errorMessage}
            </div>
          ) : loading && revenue.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading revenue data...</div>
            </div>
          ) : revenue.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">No revenue data found</div>
            </div>
          ) : (
            <div className="space-y-4">
              {revenue.map((item) => (
                <RevenueRow key={item.period} item={item} />
              ))}
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
                <span className="font-medium">Total</span>
                <span className="text-lg font-bold">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function RevenueRow({ item }: { item: RevenueData }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex flex-col">
        <span className="font-medium">{item.period}</span>
        {item.sources && Object.keys(item.sources || {}).length > 0 && (
          <div className="flex gap-2 mt-1">
            {Object.entries(item.sources).map(([source, amount]) =>
              (amount as number) > 0 ? (
                <Badge key={source} variant="secondary" className="text-xs">
                  {source.replace(/_/g, " ")}: {formatCurrency(amount as number)}
                </Badge>
              ) : null
            )}
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-lg font-bold">{formatCurrency(item.total_revenue_minor)}</div>
      </div>
    </div>
  );
}

function formatCurrency(minor: number) {
  return formatINRMinor(minor);
}
