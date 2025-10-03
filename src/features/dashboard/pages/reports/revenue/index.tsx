"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ groupBy });
        const response = await fetch(`/api/reports/revenue?${params}`);
        if (response.ok) {
          const data = await response.json();
          setRevenue(data.revenue || []);
        }
      } catch (error) {
        console.error('Failed to fetch revenue:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [groupBy]);

  const formatCurrency = (minor: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(minor / 100);
  };

  const totalRevenue = revenue.reduce((sum, r) => sum + r.total_revenue_minor, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Revenue Report</h1>
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Across all periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Periods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{revenue.length}</div>
            <p className="text-xs text-muted-foreground">
              {groupBy}ly periods with revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenue.length > 0 ? formatCurrency(totalRevenue / revenue.length) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average {groupBy}ly revenue
            </p>
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
                    <div className="flex gap-2 mt-1">
                      {Object.entries(item.sources).map(([source, amount]) => (
                        amount > 0 && (
                          <Badge key={source} variant="secondary" className="text-xs">
                            {source.replace(/_/g, ' ')}: {formatCurrency(amount)}
                          </Badge>
                        )
                      ))}
                    </div>
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