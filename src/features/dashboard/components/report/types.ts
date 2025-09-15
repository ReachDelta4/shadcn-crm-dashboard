export type ReportMode = "cards" | "scroll";

export type SectionId =
  | "p1_snapshot" | "p1_actions" | "p1_verdict"
  | "p2_graph" | "p2_summary"
  | "p3_outcomes" | "p3_priority_actions" | "p3_scripts"
  | "p4_signals" | "p4_quotes"
  | "p5_stage_scores"
  | "p6_evidence"
  | "p7_frameworks"
  | "p8_coaching"
  | "p9_action_plan" | "p9_success_metrics" | "p9_escalations"
  | "p10_appendix";

export type ReportMeta = {
  title: string;
  subject: string;
  generatedAt: string;
  timezone: string;
};

export type SummaryData = {
  rep?: string;
  prospect?: string;
  primaryAsk?: string;
  repPerformance?: number;
  dealHealth?: number;
};

export type TodoItem = { id: string; text: string; owner?: string; due?: string; done?: boolean };
export type TodoData = { todos: TodoItem[] };

export type ChartSeriesItem = { label: string; value: number };
export type ChartData = { chartKind: "horizontalBars"; series: ChartSeriesItem[]; overall?: number; dealHealth?: number };

export type StageScoreRow = { stage: string; score: number; weight: number; weighted: number; rationale?: string };
export type StageScoresData = { rows: StageScoreRow[]; total?: number };

export type QuoteItem = { text: string; speaker?: string; timestamp?: string };
export type QuotesData = { items: QuoteItem[] };

export type FrameworksData = { meddic?: unknown; bant?: unknown };
export type CoachingData = { missed?: string[]; drills?: string[]; scripts?: string[] };

export type ActionRow = { task: string; owner?: string; due?: string; priority?: string; status?: string };
export type ActionPlanData = { immediate?: ActionRow[]; shortTerm?: ActionRow[] };

export type AppendixData = { methodology?: string; rawScores?: Record<string, number>; qualityNotes?: string };

export type SectionPayloadMap = {
  p1_snapshot?: SummaryData;
  p1_actions?: TodoData;
  p1_verdict?: { text: string };
  p2_graph?: ChartData;
  p2_summary?: { text: string };
  p3_outcomes?: { items: string[] };
  p3_priority_actions?: { items: string[] };
  p3_scripts?: { items: string[] };
  p4_signals?: { items: string[] };
  p4_quotes?: QuotesData;
  p5_stage_scores?: StageScoresData;
  p6_evidence?: { quotes?: QuoteItem[]; notes?: string[] };
  p7_frameworks?: FrameworksData;
  p8_coaching?: CoachingData;
  p9_action_plan?: ActionPlanData;
  p9_success_metrics?: { items: string[] };
  p9_escalations?: { items: string[] };
  p10_appendix?: AppendixData;
};

export type ReportData = {
  reportId: string;
  meta: ReportMeta;
  data: Partial<SectionPayloadMap>;
  mode?: ReportMode;
};

