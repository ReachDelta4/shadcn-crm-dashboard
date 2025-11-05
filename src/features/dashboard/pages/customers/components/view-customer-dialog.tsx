"use client";

import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatINRMinor } from "@/utils/currency";
import type { Customer } from "@/features/dashboard/pages/customers/types/customer";

interface ViewCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewCustomerDialog({ customer, open, onOpenChange }: ViewCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true); setError(null);
    fetch(`/api/customers/${customer.id}/insights`).then(async r => {
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    }).then(setData).catch((e) => setError(typeof e?.message === 'string' ? e.message : 'Failed to load')).finally(() => setLoading(false))
  }, [open, customer.id]);

  const kpis = useMemo(() => {
    const a = data?.aggregates || {};
    return [
      { label: 'Realized Revenue', value: formatINRMinor(a.realized_total_minor || 0) },
      { label: 'Gross Profit', value: formatINRMinor(a.gross_profit_minor || 0) },
      { label: 'Gross Margin', value: `${(a.gross_margin_percent || 0).toFixed(1)}%` },
      { label: 'Invoices', value: String((data?.invoices || []).length) },
    ]
  }, [data]);

  const products = useMemo(() => (data?.aggregates?.products || []) as Array<{ name: string; quantity: number; revenue_minor: number }>, [data]);
  const schedules = useMemo(() => (data?.schedules || []) as any[], [data]);
  const recurring = useMemo(() => (data?.recurring || []) as any[], [data]);
  const invoices = useMemo(() => (data?.invoices || []) as any[], [data]);
  const sessions = useMemo(() => (data?.sessions || []) as any[], [data]);
  const lifecycle = useMemo(() => (data?.lifecycle || []) as any[], [data]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[900px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Customer Overview — {customer.fullName}</SheetTitle>
          <SheetDescription>Deep dive into lifecycle, purchases, payments, and profitability.</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : error ? (
          <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{error}</div>
        ) : (
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {kpis.map((k) => (
                <Card key={k.label}><CardHeader><CardTitle className="text-sm">{k.label}</CardTitle></CardHeader><CardContent><div className="text-lg font-semibold">{k.value}</div></CardContent></Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle>Lifecycle</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lifecycle.map((e: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between border rounded p-2">
                      <div>
                        <div className="font-medium">{e.label}</div>
                        {e.meta?.status && <div className="text-xs text-muted-foreground">Status: {e.meta.status}</div>}
                        {e.meta?.invoice_id && <div className="text-xs text-muted-foreground">Invoice: {e.meta.invoice_id}</div>}
                      </div>
                      <div className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader><CardTitle>Products</CardTitle></CardHeader>
                <CardContent>
                  {products.length === 0 ? <div className="text-sm text-muted-foreground">No products</div> : (
                    <div className="space-y-2">
                      {products.map((p, i) => (
                        <div key={i} className="flex items-center justify-between border rounded p-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground">Qty: {p.quantity}</span>
                          </div>
                          <div className="text-sm font-medium">{formatINRMinor(p.revenue_minor)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
                <CardContent>
                  {invoices.length === 0 ? <div className="text-sm text-muted-foreground">No invoices</div> : (
                    <div className="space-y-2">
                      {invoices.map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between border rounded p-2">
                          <div className="flex flex-col">
                            <span className="font-medium">{inv.id}</span>
                            <div className="text-xs text-muted-foreground flex gap-2">
                              <Badge variant="secondary">{inv.status}</Badge>
                              <span>{new Date(inv.date).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-sm font-medium">{formatINRMinor(Math.round((inv.amount || 0) * 100))}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader><CardTitle>Payment Schedules</CardTitle></CardHeader>
                <CardContent>
                  {(schedules || []).length === 0 ? <div className="text-sm text-muted-foreground">None</div> : (
                    <div className="space-y-2">
                      {schedules.map((s: any) => (
                        <div key={s.id} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <div className="text-sm font-medium">Installment {s.installment_num}</div>
                            <div className="text-xs text-muted-foreground">Due {new Date(s.due_at_utc).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={s.status === 'paid' ? 'default' : 'secondary'}>{s.status}</Badge>
                            <div className="text-sm font-medium">{formatINRMinor(s.amount_minor)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Recurring Cycles</CardTitle></CardHeader>
                <CardContent>
                  {(recurring || []).length === 0 ? <div className="text-sm text-muted-foreground">None</div> : (
                    <div className="space-y-2">
                      {recurring.map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between border rounded p-2">
                          <div>
                            <div className="text-sm font-medium">Cycle {r.cycle_num}</div>
                            <div className="text-xs text-muted-foreground">Bill {new Date(r.billing_at_utc).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={r.status === 'billed' ? 'default' : 'secondary'}>{r.status}</Badge>
                            <div className="text-sm font-medium">{formatINRMinor(r.amount_minor)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle>Sessions</CardTitle></CardHeader>
              <CardContent>
                {(sessions || []).length === 0 ? <div className="text-sm text-muted-foreground">No sessions</div> : (
                  <div className="space-y-2">
                    {sessions.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between border rounded p-2">
                        <div className="flex flex-col">
                          <span className="font-medium">{s.mode || 'session'}</span>
                          <span className="text-xs text-muted-foreground">Started {new Date(s.started_at).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
