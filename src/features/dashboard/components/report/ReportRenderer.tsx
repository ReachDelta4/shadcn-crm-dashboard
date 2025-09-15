"use client";

import React from "react";
import type { ReportData, ReportMode } from "./types";
import { ReportShell } from "./ReportShell";
import { A4Card } from "./A4Card";
import { P0TitleSection } from "./sections/P0TitleSection";
import { P1SummarySection } from "./sections/P1SummarySection";
import { P1TodoSection } from "./sections/P1TodoSection";
import { P2ChartSection } from "./sections/P2ChartSection";

export function ReportRenderer({ report }: { report: ReportData }) {
  const [mode, setMode] = React.useState<ReportMode>(report.mode || "scroll");

  const ScrollDoc = (
    <div className="space-y-4">
      <P0TitleSection meta={report.meta} />
      <P1SummarySection data={report.data.p1_snapshot} />
      <P1TodoSection data={report.data.p1_actions} />
      <P2ChartSection data={report.data.p2_graph} />
      {/* TODO: add pages 3..10 components here with demo content */}
    </div>
  );

  const CardsDoc = (
    <div className="a4-stack">
      <A4Card footer={<span>Card 0 / 10</span>}>
        <P0TitleSection meta={report.meta} />
      </A4Card>
      <A4Card footer={<span>Page 1 / 10</span>}>
        <h2 className="text-xl font-semibold mb-3">Page 1 — Executive Summary</h2>
        <P1SummarySection data={report.data.p1_snapshot} />
        <div className="mt-4" />
        <P1TodoSection data={report.data.p1_actions} />
      </A4Card>
      <A4Card footer={<span>Page 2 / 10</span>}>
        <h2 className="text-xl font-semibold mb-3">Page 2 — Stage Analysis (Graph)</h2>
        <P2ChartSection data={report.data.p2_graph} />
      </A4Card>
      {/* TODO: add A4 cards for pages 3..10 with demo content */}
    </div>
  );

  return (
    <ReportShell mode={mode} onModeChange={setMode}>
      {mode === "scroll" ? ScrollDoc : CardsDoc}
    </ReportShell>
  );
}
