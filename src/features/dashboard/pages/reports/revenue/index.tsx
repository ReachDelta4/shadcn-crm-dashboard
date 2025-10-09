"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { formatINRMinor } from "@/utils/currency";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import type { DateRange } from "react-day-picker";

interface RevenueData {
  period: string;
  total_revenue_minor: number;
  sources: {
    payment_schedules?: number;
    recurring_revenue?: number;
    one_time_invoices?: number;
  };
}

export function RevenueReportPage() {
  const [revenue, setRevenue] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"month" | "week" | "day">("month");
  const [range, setRange] = useState<DateRange | undefined>(undefined)
  const from = range?.from ? range.from.toISOString() : undefined
  const to = range?.to ? range.to.toISOString() : undefined
  const [kpis, setKpis] = useState<{ 
    realized_total_minor: number; 
    pending_total_minor: number; 
    draft_total_minor: number; 
    lead_potential_minor: number;
    gross_profit_minor: number;
    gross_margin_percent: number;
  }>({
    realized_total_minor: 0,
    pending_total_minor: 0,
    draft_total_minor: 0,
    lead_potential_minor: 0,
    gross_profit_minor: 0,
    gross_margin_percent: 0,
  })

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ groupBy });
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        const response = await fetch(`/api/reports/revenue?${params}`);
        if (response.ok) {
          const data = await response.json();
          setRevenue(data.revenue || []);
          setKpis({
            realized_total_minor: data.realized_total_minor || 0,
            pending_total_minor: data.pending_total_minor || 0,
            draft_total_minor: data.draft_total_minor || 0,
            lead_potential_minor: data.lead_potential_minor || 0,
            gross_profit_minor: data.gross_profit_minor || 0,
            gross_margin_percent: data.gross_margin_percent || 0,
          })
        }
      } catch (error) {
        console.error('Failed to fetch revenue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [groupBy, from, to]);

  const formatCurrency = (minor: number) => formatINRMinor(minor);

  const totalRevenue = revenue.reduce((sum, r) => sum + r.total_revenue_minor, 0);

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.realized_total_minor)}</div>
            <p className="text-xs text-muted-foreground">Paid invoices in range</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.gross_profit_minor)}</div>
            <p className="text-xs text-muted-foreground">Revenue - COGS</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.gross_margin_percent.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Profit / Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.pending_total_minor)}</div>
            <p className="text-xs text-muted-foreground">Sent/Pending/Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.draft_total_minor)}</div>
            <p className="text-xs text-muted-foreground">Draft invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.lead_potential_minor)}</div>
            <p className="text-xs text-muted-foreground">Open leads&#39; value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Period</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
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
                <div key={item.period} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-medium">{item.period}</span>
                    {item.sources && Object.keys(item.sources || {}).length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {Object.entries(item.sources).map(([source, amount]) => (
                          (amount as number) > 0 && (
                            <Badge key={source} variant="secondary" className="text-xs">
                              {source.replace(/_/g, ' ')}: {formatCurrency(amount as number)}
                            </Badge>
                          )
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{formatCurrency(item.total_revenue_minor)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 