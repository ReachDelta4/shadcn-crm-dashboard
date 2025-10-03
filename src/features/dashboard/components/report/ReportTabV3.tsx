"use client";

import React, { useCallback, useState, useEffect } from "react";
import { ReportPageCard } from "./ReportPageCard";
import { CardTitle } from "@/components/ui/card";
import { TitleCard } from "./sections/TitleCard";
import { ExecSummarySection } from "./sections/ExecSummarySection";
import { SessionMetaSlim } from "./sections/SessionMetaSlim";
import { BulletsSection } from "./sections/BulletsSection";
import { ObjectionListSection } from "./sections/ObjectionListSection";
import { DealHealthSection } from "./sections/DealHealthSection";
import dynamic from "next/dynamic";
const GraphSection = dynamic<any>(() => import("./sections/GraphSection").then(m => m.GraphSection), { loading: () => null });
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

const formatHandledLabel = (value: any): string => {
	if (typeof value === 'string') {
		const v = value.trim();
		return v ? v.charAt(0).toUpperCase() + v.slice(1) : 'Unknown';
	}
	if (value === true) return 'Yes';
	if (value === false) return 'No';
	return 'Unknown';
};

export function ReportTabV3({ data, deckMode }: { data?: ReportDataV3; deckMode?: boolean }) {
	const v3 = data || generatePlaceholderReportV3();
	const onSelect = useCallback((sectionId: string) => {
		const el = document.querySelector(`[data-section-id='${sectionId}']`) as HTMLElement | null;
		if (el) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
			el.focus?.();
		}
	}, []);
	const pageCount = 10;
	const [activeId, setActiveId] = useState<string | null>(null);
	const [panelTop, setPanelTop] = useState<number>(96);
	const [contentMarginRight, setContentMarginRight] = useState<number>(0);
	
	useEffect(() => {
		let raf = 0;
		const computeLayout = () => {
			const controlsEl = document.getElementById('report-controls');
			if (controlsEl) {
				const rect = controlsEl.getBoundingClientRect();
				const compactTop = 16;
				const isPast = rect.bottom <= 0; // controls scrolled out of view
				const topPx = isPast ? compactTop : Math.max(16, Math.round(rect.bottom + 8));
				setPanelTop(topPx);
			} else {
				setPanelTop(96);
			}

			// Calculate content margin based on screen size and outline presence
			const isLargeScreen = window.innerWidth >= 1024; // lg breakpoint
			if (isLargeScreen) {
				// Outline width (280px) + gap (16px) + additional padding (16px)
				setContentMarginRight(280 + 16 + 16);
			} else {
				setContentMarginRight(0);
			}
		};
		
		computeLayout();
		const ro = new ResizeObserver(() => computeLayout());
		const controlsEl = document.getElementById('report-controls');
		if (controlsEl) ro.observe(controlsEl);
		
		const onScroll = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => { raf = 0; computeLayout(); });
		};
		
		const onResize = () => {
			if (raf) return;
			raf = requestAnimationFrame(() => { raf = 0; computeLayout(); });
		};
		
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		
		return () => {
			if (controlsEl) ro.unobserve(controlsEl);
			ro.disconnect();
			window.removeEventListener('resize', onResize);
			window.removeEventListener('scroll', onScroll);
			if (raf) cancelAnimationFrame(raf);
		};
	}, []);

	useEffect(() => {
		const sections = Array.from(document.querySelectorAll<HTMLElement>("section[data-section-id^='p']"));
		if (sections.length === 0) return;

		const lastActiveRef = { current: null as string | null };
		let frame = 0;
		const pickActive = () => {
			const anchorY = window.innerHeight / 3;
			let bestId: string | null = null;
			let bestDist = Infinity;
			for (const el of sections) {
				const r = el.getBoundingClientRect();
				const mid = r.top + r.height / 2;
				if (r.bottom < 80 || r.top > window.innerHeight - 80) continue;
				const d = Math.abs(mid - anchorY);
				if (d < bestDist) { bestDist = d; bestId = el.getAttribute("data-section-id"); }
			}
			if (bestId && bestId !== lastActiveRef.current) {
				lastActiveRef.current = bestId;
				setActiveId(bestId);
			}
		};

		const onScroll = () => {
			if (frame) return;
			frame = requestAnimationFrame(() => { frame = 0; pickActive(); });
		};

		const io = new IntersectionObserver(onScroll, { root: null, threshold: [0, 0.25, 0.5, 0.75, 1] });
		sections.forEach(el => io.observe(el));
		window.addEventListener("scroll", onScroll, { passive: true });

		pickActive();

		return () => {
			io.disconnect();
			window.removeEventListener("scroll", onScroll);
			if (frame) cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<div className="relative">
			{/* Main content with dynamic margin */}
			<div 
				className="transition-all duration-300 ease-in-out"
				style={{ 
					marginRight: contentMarginRight,
					paddingRight: 0 
				}}
			>
				<TitleCard title={v3.tp_title} subtitle={v3.tp_subtitle} deal={v3.tp_deal} sessionId={v3.tp_sessionId} />

				<div className="space-y-4 mt-4">
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
								series={(v3.p4_stage_eval || []).map(s => ({ label: String(s.stage || 'Stage'), value: Math.max(0, Math.min(10, Number(s.score ?? 0))) * 10 }))}
								overall={v3.p4_stage_eval && v3.p4_stage_eval.length ? Math.round((v3.p4_stage_eval.reduce((sum, s) => sum + Number(s.score ?? 0), 0) / v3.p4_stage_eval.length) * 10) : undefined}
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
											<td className="py-2 pr-2 whitespace-nowrap">{String(r.stage || 'Unknown')}</td>
											<td className="py-2 pr-2">{formatHandledLabel(r.handled)}</td>
											<td className="py-2 pr-2 text-right tabular-nums">{Math.max(0, Math.min(10, Number(r.score ?? 0)))}</td>
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
			
			{/* Fixed floating outline that follows viewport */}
			<div className="hidden lg:block fixed z-30 print:hidden" id="report-outline-panel" style={{ 
				top: panelTop, 
				right: 16, 
				width: 280, 
				height: `calc(100vh - ${panelTop + 16}px)`,
				maxHeight: `calc(100vh - ${panelTop + 16}px)`
			}}>
				<ReportOutlineV3 onSelect={onSelect} activeId={activeId || undefined} />
			</div>
		</div>
	);
}
