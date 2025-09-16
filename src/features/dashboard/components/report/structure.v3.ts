

export type OutlineNode = {
	id: string;
	label: string;
	anchorId?: string;
	children?: OutlineNode[];
};

export const REPORT_STRUCTURE_V3: OutlineNode[] = [
	{
		id: "tp",
		label: "Title Page",
		children: [
			{ id: "tp_title", label: "Title" },
			{ id: "tp_subtitle", label: "Subtitle / Deal / Session ID" },
		],
	},
	{
		id: "p1",
		label: "Page 1 — Executive Summary",
		children: [
			{ id: "p1_exec_headline", label: "One-line headline" },
			{ id: "p1_exec_synopsis", label: "2–3 line synopsis" },
			{ id: "p1_meta_full", label: "Session Metadata" },
			{ id: "p1_key_points", label: "Key Discussion Points" },
			{ id: "p1_pains", label: "Prospect Pain Points" },
			{ id: "p1_buying_signals", label: "Explicit Buying Signals" },
			{ id: "p1_objections_handled", label: "Key Objections Raised" },
			{ id: "p1_action_items", label: "Action Items" },
			{ id: "p1_deal_health", label: "Call Deal Health" },
		],
	},
	{
		id: "p2",
		label: "Page 2 — Discussion Highlights",
		children: [
			{ id: "p2_context_snapshot", label: "Performance / Context Header" },
			{ id: "p2_high_priority", label: "High Priority Items" },
			{ id: "p2_medium_priority", label: "Medium Priority Items" },
			{ id: "p2_info_items", label: "Informational Items" },
			{ id: "p2_risks_concerns", label: "Risks & Concerns" },
			{ id: "p2_short_summary", label: "Short Summary (next best move)" },
		],
	},
	{
		id: "p3",
		label: "Page 3 — Deal Health & Outcomes",
		children: [
			{ id: "p3_deal_health_summary", label: "Deal Health Summary" },
			{ id: "p3_meddicc", label: "MEDDICC Snapshot" },
			{ id: "p3_bant", label: "BANT Snapshot" },
			{ id: "p3_missed_opportunities", label: "Missed Opportunities" },
			{ id: "p3_improvements", label: "Areas to Improve" },
			{ id: "p3_short_reco", label: "Short recommendation" },
		],
	},
		{
			id: "p4",
			label: "Page 4 — Call Stages Overview",
			children: [
				{ id: "p4_stages_graph", label: "Call Stages Graph" },
				{ id: "p4_stage_eval", label: "Stage Scores (1–10)" },
				{ id: "p4_pivotal_points", label: "Pivotal points" },
				{ id: "p4_takeaway", label: "Short takeaway" },
			],
		},
	{ id: "p5", label: "Page 5 — Stage Analysis", children: [ { id: "p5_stage_a", label: "Stage A" }, { id: "p5_stage_b", label: "Stage B" } ] },
	{ id: "p6", label: "Page 6 — Stage Analysis", children: [ { id: "p6_stage_c", label: "Stage C" }, { id: "p6_stage_d", label: "Stage D" } ] },
	{ id: "p7", label: "Page 7 — Stage Analysis", children: [ { id: "p7_stage_e", label: "Stage E" }, { id: "p7_stage_f", label: "Stage F" } ] },
	{ id: "p8", label: "Page 8 — Stage Analysis", children: [ { id: "p8_stage_g", label: "Stage G" }, { id: "p8_stage_h", label: "Stage H" } ] },
	{ id: "p9", label: "Page 9 — Stage Analysis", children: [ { id: "p9_stage_i", label: "Stage I" }, { id: "p9_stage_j", label: "Stage J" } ] },
	{ id: "p10", label: "Page 10 — Stage Analysis", children: [ { id: "p10_stage_k", label: "Stage K" }, { id: "p10_stage_l", label: "Stage L" }, { id: "apx_scoring_rubric", label: "Appendix: Scoring rubric" }, { id: "apx_data_flags", label: "Appendix: Data quality flags" } ] },
];
