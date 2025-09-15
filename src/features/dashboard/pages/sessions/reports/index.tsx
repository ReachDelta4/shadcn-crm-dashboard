"use client";

import { ReportRenderer } from "@/features/dashboard/components/report/ReportRenderer";
import type { ReportData } from "@/features/dashboard/components/report/types";

const demo: ReportData = {
  reportId: "rep_demo",
  meta: {
    title: "Sales Call Analysis — 10‑Page Sample Report",
    subject: "Vignesh / Manoj",
    generatedAt: "2025-09-15",
    timezone: "Asia/Kolkata",
  },
  data: {
    p1_snapshot: {
      rep: "Manoj (Cap Center)",
      prospect: "Vignesh",
      primaryAsk: "Career transition bundle",
      repPerformance: 68,
      dealHealth: 66,
    },
    p1_actions: {
      todos: [
        { id: "t1", text: "Send follow‑up email with EMI options", owner: "Manoj", due: "24–48h", done: false },
        { id: "t2", text: "Book follow‑up call (2–3 slots)", owner: "Manoj", due: "48h", done: false },
        { id: "t3", text: "Competitor differentiation one‑pager", owner: "Sales Enablement", due: "3d", done: false },
      ],
    },
    p2_graph: {
      chartKind: "horizontalBars",
      series: [
        { label: "Greetings", value: 90 },
        { label: "Introduction", value: 85 },
        { label: "Customer Success Stories", value: 0 },
      ],
      overall: 67.8,
      dealHealth: 66,
    },
  },
  mode: "scroll",
};

export function SessionsReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ReportRenderer report={demo} />
    </div>
  );
}

