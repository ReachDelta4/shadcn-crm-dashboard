"use client";

import React, { useCallback } from "react";
import { ReportPageCard } from "./ReportPageCard";
import { CardTitle } from "@/components/ui/card";
import { TitleCard } from "./sections/TitleCard";
import { ExecSummarySection } from "./sections/ExecSummarySection";
import { SessionMetaSlim } from "./sections/SessionMetaSlim";
import { BulletsSection } from "./sections/BulletsSection";
import { ObjectionListSection } from "./sections/ObjectionListSection";
import { DealHealthSection } from "./sections/DealHealthSection";
import { GraphSection } from "./sections/GraphSection";
import { StageOverviewListSection } from "./sections/StageOverviewListSection";
import { PivotalPointsSection } from "./sections/PivotalPointsSection";
import { RecommendationSection } from "./sections/RecommendationSection";
import { StageDeepDiveSection } from "./sections/StageDeepDiveSection";
import { FrameworkMEDDICC } from "./sections/FrameworkMEDDICC";
import { FrameworkBANT } from "./sections/FrameworkBANT";
import { RiskProfileSection } from "./sections/RiskProfileSection";
import { ReportOutlineV3 } from "./ReportOutlineV3";
import { PlayfulTodolist } from "./sections/PlayfulTodolist";
import type { ReportDataV3 } from "./types.v3";
import { generatePlaceholderReportV3 } from "./fixtures/placeholder.v3";

export function ReportTabV3({ data }: { data?: ReportDataV3 }) {
	const v3 = data || generatePlaceholderReportV3();
	const onSelect = useCallback((sectionId: string) => {
		const el = document.querySelector(`[data-section-id='${sectionId}']`) as HTMLElement | null;
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			el.focus?.();
		}
	}, []);
	const pageCount = 10;

	return (
		<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
			<div className="lg:col-span-3">
				<ReportOutlineV3 onSelect={onSelect} />
			</div>
			<div className="lg:col-span-9 space-y-4">
				<TitleCard title={v3.tp_title} subtitle={v3.tp_subtitle} deal={v3.tp_deal} sessionId={v3.tp_sessionId} />

				<ReportPageCard sectionId="p1" header={<CardTitle className="text-2xl">Page 1 — Executive Summary</CardTitle>} pageNumber={1} pageCount={pageCount} showPrintFooter>
					<div id="p1_exec_headline" data-section-id="p1_exec_headline" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<ExecSummarySection headline={v3.p1_exec_headline} synopsis={v3.p1_exec_synopsis} />
					</div>
					<div id="p1_meta_full" data-section-id="p1_meta_full" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<SessionMetaSlim {...(v3.p1_meta_full || {})} />
					</div>
					<div id="p1_key_points" data-section-id="p1_key_points" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Key Discussion Points" items={v3.p1_key_points} />
					</div>
					<div id="p1_pains" data-section-id="p1_pains" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Prospect Pain Points" items={v3.p1_pains} />
					</div>
					<div id="p1_buying_signals" data-section-id="p1_buying_signals" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Explicit Buying Signals" items={v3.p1_buying_signals} />
					</div>
					<div id="p1_objections_handled" data-section-id="p1_objections_handled" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<ObjectionListSection items={v3.p1_objections_handled} />
					</div>
					<div id="p1_action_items" data-section-id="p1_action_items" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<PlayfulTodolist items={(v3.p1_action_items || []).map(a => ({ id: a.id, title: a.title, owner: a.owner, due: a.due, done: false }))} />
					</div>
					<div id="p1_deal_health" data-section-id="p1_deal_health" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<DealHealthSection score={v3.p1_deal_health?.score} rationale={v3.p1_deal_health?.rationale} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p2" header={<CardTitle className="text-2xl">Page 2 — Discussion Highlights</CardTitle>} pageNumber={2} pageCount={pageCount} showPrintFooter>
					<div id="p2_context_snapshot" data-section-id="p2_context_snapshot" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<div className="text-[15px] text-muted-foreground">{v3.p2_context_snapshot || "Snapshot placeholder"}</div>
					</div>
					<div id="p2_high_priority" data-section-id="p2_high_priority" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="High Priority Items" items={v3.p2_high_priority} />
					</div>
					<div id="p2_medium_priority" data-section-id="p2_medium_priority" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Medium Priority Items" items={v3.p2_medium_priority} />
					</div>
					<div id="p2_info_items" data-section-id="p2_info_items" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Informational Items" items={v3.p2_info_items} />
					</div>
					<div id="p2_risks_concerns" data-section-id="p2_risks_concerns" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<RiskProfileSection items={v3.p2_risks_concerns as any} />
					</div>
					<div id="p2_short_summary" data-section-id="p2_short_summary" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<div className="text-[15px] text-muted-foreground">{v3.p2_short_summary || "2-line next best move"}</div>
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p3" header={<CardTitle className="text-2xl">Page 3 — Deal Health & Outcomes</CardTitle>} pageNumber={3} pageCount={pageCount} showPrintFooter>
					<div id="p3_deal_health_summary" data-section-id="p3_deal_health_summary" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<DealHealthSection score={v3.p3_deal_health_summary?.score} rationale={v3.p3_deal_health_summary?.status} />
					</div>
					<div id="p3_meddicc" data-section-id="p3_meddicc" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<FrameworkMEDDICC {...(v3.p3_meddicc || {})} />
					</div>
					<div id="p3_bant" data-section-id="p3_bant" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<FrameworkBANT rows={v3.p3_bant?.rows} />
					</div>
					<div id="p3_missed_opportunities" data-section-id="p3_missed_opportunities" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Missed Opportunities" items={v3.p3_missed_opportunities} />
					</div>
					<div id="p3_improvements" data-section-id="p3_improvements" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Areas to Improve" items={v3.p3_improvements} />
					</div>
					<div id="p3_short_reco" data-section-id="p3_short_reco" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<RecommendationSection text={v3.p3_short_reco} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p4" header={<CardTitle className="text-2xl">Page 4 — Call Stages Overview</CardTitle>} pageNumber={4} pageCount={pageCount} showPrintFooter>
					<div id="p4_stages_graph" data-section-id="p4_stages_graph" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<GraphSection 
							mode="line"
							series={(v3.p4_stage_eval || []).map(s => ({ label: s.stage, value: Math.max(0, Math.min(10, s.score)) * 10 }))}
							overall={v3.p4_stage_eval ? Math.round((v3.p4_stage_eval.reduce((sum, s) => sum + s.score, 0) / v3.p4_stage_eval.length) * 10) : undefined}
							dealHealth={v3.p3_deal_health_summary?.score ?? v3.p1_deal_health?.score}
						/>
					</div>
					<div id="p4_stage_eval" data-section-id="p4_stage_eval" className="scroll-mt-24 mt-2 overflow-auto" style={{ breakInside: "avoid" }}>
						<div className="text-[14px] font-medium mb-2">Stage Scores (1–10)</div>
						<table className="w-full text-[13px]">
							<thead>
								<tr className="text-left border-b bg-muted/30">
									<th className="py-2 pr-2">Stage</th>
									<th className="py-2 pr-2">Handled?</th>
									<th className="py-2 pr-2 text-right">Score (1–10)</th>
								</tr>
							</thead>
							<tbody>
								{(v3.p4_stage_eval || []).map((r, i) => (
									<tr key={i} className="border-b last:border-0 even:bg-muted/10">
										<td className="py-2 pr-2 whitespace-nowrap">{r.stage}</td>
										<td className="py-2 pr-2">{r.handled.charAt(0).toUpperCase() + r.handled.slice(1)}</td>
										<td className="py-2 pr-2 text-right tabular-nums">{Math.max(0, Math.min(10, r.score))}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div id="p4_pivotal_points" data-section-id="p4_pivotal_points" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<div className="text-[14px] font-medium mb-2">Pivotal Points</div>
						<PivotalPointsSection points={v3.p4_pivotal_points as any} />
					</div>
					<div id="p4_takeaway" data-section-id="p4_takeaway" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<div className="text-[14px] font-medium mb-2">Key Takeaway</div>
						<RecommendationSection text={v3.p4_takeaway} />
					</div>
				</ReportPageCard>

				{/* Pages 5–10, 2 stages per page */}
				<ReportPageCard sectionId="p5" header={<CardTitle className="text-2xl">Page 5 — Stage Analysis</CardTitle>} pageNumber={5} pageCount={pageCount} showPrintFooter>
					<StageDeepDiveSection stages={v3.p5_stage_a} />
					<StageDeepDiveSection stages={v3.p5_stage_b} />
				</ReportPageCard>
				<ReportPageCard sectionId="p6" header={<CardTitle className="text-2xl">Page 6 — Stage Analysis</CardTitle>} pageNumber={6} pageCount={pageCount} showPrintFooter>
					<StageDeepDiveSection stages={v3.p6_stage_c} />
					<StageDeepDiveSection stages={v3.p6_stage_d} />
				</ReportPageCard>
				<ReportPageCard sectionId="p7" header={<CardTitle className="text-2xl">Page 7 — Stage Analysis</CardTitle>} pageNumber={7} pageCount={pageCount} showPrintFooter>
					<StageDeepDiveSection stages={v3.p7_stage_e} />
					<StageDeepDiveSection stages={v3.p7_stage_f} />
				</ReportPageCard>
				<ReportPageCard sectionId="p8" header={<CardTitle className="text-2xl">Page 8 — Stage Analysis</CardTitle>} pageNumber={8} pageCount={pageCount} showPrintFooter>
					<StageDeepDiveSection stages={v3.p8_stage_g} />
					<StageDeepDiveSection stages={v3.p8_stage_h} />
				</ReportPageCard>
				<ReportPageCard sectionId="p9" header={<CardTitle className="text-2xl">Page 9 — Stage Analysis</CardTitle>} pageNumber={9} pageCount={pageCount} showPrintFooter>
					<StageDeepDiveSection stages={v3.p9_stage_i} />
					<StageDeepDiveSection stages={v3.p9_stage_j} />
				</ReportPageCard>
				<ReportPageCard sectionId="p10" header={<CardTitle className="text-2xl">Page 10 — Stage Analysis</CardTitle>} pageNumber={10} pageCount={pageCount} showPrintFooter>
					<StageDeepDiveSection stages={v3.p10_stage_k} />
					<StageDeepDiveSection stages={v3.p10_stage_l} />
					<div id="apx_scoring_rubric" data-section-id="apx_scoring_rubric" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Appendix — Scoring Rubric" items={v3.apx_scoring_rubric} />
					</div>
					<div id="apx_data_flags" data-section-id="apx_data_flags" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Appendix — Data Quality Flags" items={v3.apx_data_flags} />
					</div>
				</ReportPageCard>
			</div>
		</div>
	);
}
