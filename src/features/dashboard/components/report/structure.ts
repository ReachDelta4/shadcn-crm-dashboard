export const REPORT_STRUCTURE_VERSION = "v1" as const;

export type OutlineNode = { id: string; label: string; children?: OutlineNode[] };

export const REPORT_OUTLINE: OutlineNode[] = [
  {
    id: "p1",
    label: "Page 1 — Executive Summary",
    children: [
      { id: "p1_snapshot", label: "Call snapshot" },
      { id: "p1_actions", label: "Top 3 actions" },
      { id: "p1_verdict", label: "One‑line verdict" },
    ],
  },
  {
    id: "p2",
    label: "Page 2 — Stage Analysis (Graph)",
    children: [
      { id: "p2_graph", label: "Graph" },
      { id: "p2_summary", label: "Short summary" },
    ],
  },
  {
    id: "p3",
    label: "Page 3 — Key Outcomes & Next Steps",
    children: [
      { id: "p3_outcomes", label: "Key outcomes" },
      { id: "p3_priority_actions", label: "Priority actions" },
      { id: "p3_scripts", label: "Scripts & templates" },
    ],
  },
  {
    id: "p4",
    label: "Page 4 — Signals & Sentiment",
    children: [
      { id: "p4_signals", label: "Signals" },
      { id: "p4_quotes", label: "Key quotes" },
    ],
  },
  { id: "p5", label: "Page 5 — Stage Scoring", children: [ { id: "p5_stage_scores", label: "Stage-by-stage" } ] },
  { id: "p6", label: "Page 6 — Evidence & Notes", children: [ { id: "p6_evidence", label: "Evidence" } ] },
  { id: "p7", label: "Page 7 — MEDDICC & BANT", children: [ { id: "p7_frameworks", label: "Frameworks" } ] },
  { id: "p8", label: "Page 8 — Coaching Playbook", children: [ { id: "p8_coaching", label: "Coaching" } ] },
  {
    id: "p9",
    label: "Page 9 — Action Plan & Metrics",
    children: [
      { id: "p9_action_plan", label: "Action plan" },
      { id: "p9_success_metrics", label: "Success metrics" },
      { id: "p9_escalations", label: "Escalations" },
    ],
  },
  { id: "p10", label: "Page 10 — Appendix", children: [ { id: "p10_appendix", label: "Appendix" } ] },
];

