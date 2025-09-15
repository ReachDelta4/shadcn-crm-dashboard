"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { SummaryData } from "../types";

export function P1SummarySection({ data }: { data?: SummaryData }) {
  return (
    <section data-section-id="p1_snapshot">
      <Card>
        <CardHeader>
          <CardTitle>Call snapshot (single glance)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div><span className="font-medium">Rep:</span> {data?.rep || "—"}</div>
          <div><span className="font-medium">Prospect:</span> {data?.prospect || "—"}</div>
          <div><span className="font-medium">Primary ask:</span> {data?.primaryAsk || "—"}</div>
          <div><span className="font-medium">Rep Performance:</span> {data?.repPerformance ?? "—"} / 100</div>
          <div><span className="font-medium">Deal Health:</span> {data?.dealHealth ?? "—"} / 100</div>
        </CardContent>
      </Card>
    </section>
  );
}

