"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { ChartData } from "../types";

export function P2ChartSection({ data }: { data?: ChartData }) {
  return (
    <section data-section-id="p2_graph">
      <Card>
        <CardHeader>
          <CardTitle>Stage Analysis (Graph)</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer id="report-stage-chart" config={{ a: { label: "A", color: "#10b981" } }}>
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">Graph placeholder</div>
          </ChartContainer>
          <div className="text-xs text-muted-foreground mt-2">
            Weighted Overall: {data?.overall ?? "—"} · Deal Health: {data?.dealHealth ?? "—"}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

