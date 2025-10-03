"use client";

import React, { useCallback } from "react";
import { ReportOutline } from "./ReportOutline";
import { ReportPageCard } from "./ReportPageCard";
import { CardTitle } from "@/components/ui/card";
import { TitleSection } from "./sections/TitleSection";
import { MetadataSection } from "./sections/MetadataSection";
import { BulletsSection } from "./sections/BulletsSection";
import { QuotesSection } from "./sections/QuotesSection";
import dynamic from "next/dynamic";
const GraphSection = dynamic<any>(() => import("./sections/GraphSection").then(m => m.GraphSection), { loading: () => null });
import { ScriptsSection } from "./sections/ScriptsSection";
import { StageScoresTable } from "./sections/StageScoresTable";
import { PlayfulTodolist } from "./sections/PlayfulTodolist";
import { TextBlockSection } from "./sections/TextBlockSection";
import { FrameworkMEDDICC } from "./sections/FrameworkMEDDICC";
import { FrameworkBANT } from "./sections/FrameworkBANT";
import { RiskProfileSection } from "./sections/RiskProfileSection";
import { PlaybookSection } from "./sections/PlaybookSection";
import { MicroDrillsSection } from "./sections/MicroDrillsSection";
import { MetricsTableSection } from "./sections/MetricsTableSection";
import { RawScoresTable } from "./sections/RawScoresTable";

export type ReportData = Record<string, any>;

type Props = {
	data: ReportData;
};

export function ReportTab({ data }: Props) {
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
				<ReportOutline onSelect={onSelect} />
			</div>
			<div className="lg:col-span-9 space-y-4">
				<ReportPageCard sectionId="p1" header={<CardTitle className="text-2xl">Page 1 - Executive Summary</CardTitle>} pageNumber={1} pageCount={pageCount} showPrintFooter>
					<div id="p1_title" data-section-id="p1_title" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<TitleSection title={data?.p1_title?.title || data?.p0_title?.title || "Sales Call Analysis — Enterprise Sales Report"} />
					</div>
					<div id="p1_short_summary" data-section-id="p1_short_summary" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<div className="text-[15px] text-muted-foreground">{data?.p1_short_summary?.text || "Summary unavailable"}</div>
					</div>
					<div id="p1_session_metadata" data-section-id="p1_session_metadata" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<MetadataSection {...(data?.p1_session_metadata || {})} />
					</div>
					<div id="p1_key_points" data-section-id="p1_key_points" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Key Points" items={data?.p1_key_points?.items} />
					</div>
					<div id="p1_buying_signals" data-section-id="p1_buying_signals" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<QuotesSection quotes={(data?.p1_buying_signals?.quotes || []).map((t: string) => ({ text: t }))} />
					</div>
					<div id="p1_objections" data-section-id="p1_objections" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Objections" items={data?.p1_objections?.items} />
					</div>
					<div id="p1_pain_points" data-section-id="p1_pain_points" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Pain Points" items={data?.p1_pain_points?.items} />
					</div>
					<div id="p1_rapport_discovery_commitment" data-section-id="p1_rapport_discovery_commitment" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Rapport, Discovery & Commitment" items={data?.p1_rapport_discovery_commitment?.notes} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p2" header={<CardTitle className="text-2xl">Page 2 - Overview</CardTitle>} pageNumber={2} pageCount={pageCount} showPrintFooter>
					<div id="p2_performance_graph" data-section-id="p2_performance_graph" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<GraphSection {...(data?.p2_performance_graph || {})} />
					</div>
					<div id="p2_session_snapshot" data-section-id="p2_session_snapshot" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Session Snapshot" items={data?.p2_session_snapshot?.bullets} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p3" header={<CardTitle className="text-2xl">Page 3 - Outcomes & Actions</CardTitle>} pageNumber={3} pageCount={pageCount} showPrintFooter>
					<div id="p3_outcomes" data-section-id="p3_outcomes" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Outcomes" items={data?.p3_outcomes?.bullets} />
					</div>
					<div id="p3_priority_actions" data-section-id="p3_priority_actions" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<PlayfulTodolist
							items={(data?.p3_priority_actions?.actions || []).map((a: any) => ({ id: a.id, title: a.title, owner: a.owner, due: a.due, details: a.details, done: false }))}
						/>
					</div>
					<div id="p3_copyable_scripts" data-section-id="p3_copyable_scripts" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<ScriptsSection {...(data?.p3_copyable_scripts || {})} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p4" header={<CardTitle className="text-2xl">Page 4 - Signals & Competition</CardTitle>} pageNumber={4} pageCount={pageCount} showPrintFooter>
					<div id="p4_signals" data-section-id="p4_signals" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Signals" items={data?.p4_signals?.bullets} />
					</div>
					<div id="p4_price_competition" data-section-id="p4_price_competition" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Price & Competition" items={(data?.p4_price_competition?.competitorNotes || []).concat([`Price Expectation: ${data?.p4_price_competition?.priceExpectation || '-'}`])} />
					</div>
					<div id="p4_emotional_cognitive_cues" data-section-id="p4_emotional_cognitive_cues" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Emotional & Cognitive Cues" items={data?.p4_emotional_cognitive_cues?.bullets} />
					</div>
					<div id="p4_recommended_reply" data-section-id="p4_recommended_reply" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<div className="text-[15px]"><span className="font-medium">Recommended Reply:</span> {data?.p4_recommended_reply?.text || "-"}</div>
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p5" header={<CardTitle className="text-2xl">Page 5 - Stage Scores</CardTitle>} pageNumber={5} pageCount={pageCount} showPrintFooter>
					<div id="p5_stage_scoring_table" data-section-id="p5_stage_scoring_table" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<StageScoresTable {...(data?.p5_stage_scoring_table || {})} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p6" header={<CardTitle className="text-2xl">Page 6 - Transcript Analysis</CardTitle>} pageNumber={6} pageCount={pageCount} showPrintFooter>
					<div id="p6_key_quotes" data-section-id="p6_key_quotes" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<QuotesSection quotes={(data?.p6_key_quotes?.quotes || []).map((q: any) => ({ text: q.text, speaker: q.speaker, timestamp: q.ts }))} />
					</div>
					<div id="p6_transcript_notes" data-section-id="p6_transcript_notes" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<TextBlockSection title="Transcript Notes" text={data?.p6_transcript_notes?.text} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p7" header={<CardTitle className="text-2xl">Page 7 - Frameworks</CardTitle>} pageNumber={7} pageCount={pageCount} showPrintFooter>
					<div id="p7_meddicc" data-section-id="p7_meddicc" className="scroll-mt-24 space-y-2" style={{ breakInside: "avoid" }}>
						<div className="text-[15px] font-semibold">MEDDICC Analysis</div>
						<FrameworkMEDDICC {...(data?.p7_meddicc || {})} />
					</div>
					<div id="p7_bant" data-section-id="p7_bant" className="scroll-mt-24 space-y-2" style={{ breakInside: "avoid" }}>
						<div className="text-[15px] font-semibold">BANT Qualification</div>
						<FrameworkBANT rows={data?.p7_bant?.rows} />
					</div>
					<div id="p7_risk_profile" data-section-id="p7_risk_profile" className="scroll-mt-24 space-y-2" style={{ breakInside: "avoid" }}>
						<div className="text-[15px] font-semibold">Risk Profile</div>
						<RiskProfileSection items={data?.p7_risk_profile?.items} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p8" header={<CardTitle className="text-2xl">Page 8 - Coaching</CardTitle>} pageNumber={8} pageCount={pageCount} showPrintFooter>
					<div id="p8_missed_opportunities" data-section-id="p8_missed_opportunities" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Missed Opportunities" items={data?.p8_missed_opportunities?.bullets} />
					</div>
					<div id="p8_coaching_playbook" data-section-id="p8_coaching_playbook" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<PlaybookSection groups={data?.p8_coaching_playbook?.groups} />
					</div>
					<div id="p8_micro_drills" data-section-id="p8_micro_drills" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<MicroDrillsSection drills={data?.p8_micro_drills?.drills} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p9" header={<CardTitle className="text-2xl">Page 9 - Action Plan</CardTitle>} pageNumber={9} pageCount={pageCount} showPrintFooter>
					<div id="p9_immediate_actions" data-section-id="p9_immediate_actions" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Immediate Actions" items={data?.p9_immediate_actions?.bullets} />
					</div>
					<div id="p9_short_term_actions" data-section-id="p9_short_term_actions" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Short-term Actions" items={data?.p9_short_term_actions?.bullets} />
					</div>
					<div id="p9_success_metrics" data-section-id="p9_success_metrics" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<MetricsTableSection rows={data?.p9_success_metrics?.rows} />
					</div>
					<div id="p9_escalations" data-section-id="p9_escalations" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<BulletsSection title="Escalations" items={data?.p9_escalations?.bullets} />
					</div>
				</ReportPageCard>

				<ReportPageCard sectionId="p10" header={<CardTitle className="text-2xl">Page 10 - Methodology</CardTitle>} pageNumber={10} pageCount={pageCount} showPrintFooter>
					<div id="p10_methodology" data-section-id="p10_methodology" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<TextBlockSection title="Methodology" text={data?.p10_methodology?.text} />
					</div>
					<div id="p10_raw_scores" data-section-id="p10_raw_scores" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<RawScoresTable rows={data?.p10_raw_scores?.rows} />
					</div>
					<div id="p10_quality_notes" data-section-id="p10_quality_notes" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<TextBlockSection title="Quality Notes" text={data?.p10_quality_notes?.text} />
					</div>
					<div id="p10_coaching_usage" data-section-id="p10_coaching_usage" className="scroll-mt-24" style={{ breakInside: "avoid" }}>
						<TextBlockSection title="Coaching Usage" text={data?.p10_coaching_usage?.text} />
					</div>
				</ReportPageCard>
			</div>
		</div>
	);
}
