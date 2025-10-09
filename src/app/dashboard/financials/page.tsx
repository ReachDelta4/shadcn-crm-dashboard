"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatINRMinor } from "@/utils/currency";

type PaySchedule = { id: string; invoice_id: string; invoice_line_id?: string | null; installment_num: number; due_at_utc: string; amount_minor: number; status: string };
type RecSchedule = { id: string; invoice_line_id: string; cycle_num: number; billing_at_utc: string; amount_minor: number; status: string };

export default function FinancialsPage() {
  const [pay, setPay] = useState<PaySchedule[]>([]);
  const [rec, setRec] = useState<RecSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"upcoming"|"due"|"overdue"|"paid">("upcoming");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [pRes, rRes] = await Promise.all([
          fetch("/api/financials/payment"),
          fetch("/api/financials/recurring"),
        ]);
        const pJson = pRes.ok ? await pRes.json() : { items: [] };
        const rJson = rRes.ok ? await rRes.json() : { items: [] };
        setPay(pJson.items || []);
        setRec(rJson.items || []);
      } catch {
        setPay([]); setRec([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const now = Date.now();
  const filteredPay = useMemo(() => pay.filter(s => {
    const due = Date.parse(s.due_at_utc);
    if (tab === "paid") return s.status === "paid";
    if (tab === "overdue") return s.status !== "paid" && due < now;
    if (tab === "due") return s.status !== "paid" && Math.abs(due - now) < 24*3600*1000;
    return s.status !== "paid" && due > now;
  }), [pay, tab, now]);

  const filteredRec = useMemo(() => rec.filter(s => {
    const bill = Date.parse(s.billing_at_utc);
    if (tab === "paid") return s.status === "billed";
    if (tab === "overdue") return s.status !== "billed" && bill < now;
    if (tab === "due") return s.status !== "billed" && Math.abs(bill - now) < 24*3600*1000;
    return s.status !== "billed" && bill > now;
  }), [rec, tab, now]);

  const onMarkPaid = async (id: string) => {
    await fetch(`/api/schedules/payment/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "paid" }) });
    // refresh
    const res = await fetch("/api/financials/payment");
    const j = res.ok ? await res.json() : { items: [] };
    setPay(j.items || []);
  };
  const onMarkBilled = async (id: string) => {
    await fetch(`/api/schedules/recurring/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "billed" }) });
    const res = await fetch("/api/financials/recurring");
    const j = res.ok ? await res.json() : { items: [] };
    setRec(j.items || []);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Financials</h1>
        <div className="flex gap-2">
          <Button variant={tab==="upcoming"?"default":"outline"} onClick={()=>setTab("upcoming")}>Upcoming</Button>
          <Button variant={tab==="due"?"default":"outline"} onClick={()=>setTab("due")}>Due Today</Button>
          <Button variant={tab==="overdue"?"default":"outline"} onClick={()=>setTab("overdue")}>Overdue</Button>
          <Button variant={tab==="paid"?"default":"outline"} onClick={()=>setTab("paid")}>Paid/Billed</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Payment Schedules</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : filteredPay.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items</div>
            ) : (
              <div className="space-y-2">
                {filteredPay.map(s => (
                  <div key={s.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="text-sm font-medium">Installment {s.installment_num}</div>
                      <div className="text-xs text-muted-foreground">Due {new Date(s.due_at_utc).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status==="paid"?"default":"secondary"}>{s.status}</Badge>
                      {s.status !== "paid" && (
                        <Button size="sm" onClick={()=>onMarkPaid(s.id)}>Mark Paid</Button>
                      )}
                      <div className="text-right text-sm font-bold">{formatINRMinor(s.amount_minor)}</div>
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
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : filteredRec.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items</div>
            ) : (
              <div className="space-y-2">
                {filteredRec.map(s => (
                  <div key={s.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="text-sm font-medium">Cycle {s.cycle_num}</div>
                      <div className="text-xs text-muted-foreground">Bill {new Date(s.billing_at_utc).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={s.status==="billed"?"default":"secondary"}>{s.status}</Badge>
                      {s.status !== "billed" && (
                        <Button size="sm" onClick={()=>onMarkBilled(s.id)}>Mark Billed</Button>
                      )}
                      <div className="text-right text-sm font-bold">{formatINRMinor(s.amount_minor)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
