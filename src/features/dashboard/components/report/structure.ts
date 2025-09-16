export type ReportSection = {
	id: string;
	label: string;
};

export type ReportPage = {
	id: string;
	label: string;
	sections: ReportSection[];
};

export const REPORT_STRUCTURE: ReportPage[] = [
	{
		id: "p1",
		label: "Page 1 - Executive Summary",
		sections: [
			{ id: "p1_title", label: "Title" },
			{ id: "p1_short_summary", label: "Short Summary" },
			{ id: "p1_session_metadata", label: "Session Metadata" },
			{ id: "p1_key_points", label: "Key Points" },
			{ id: "p1_buying_signals", label: "Buying Signals" },
			{ id: "p1_objections", label: "Objections" },
			{ id: "p1_pain_points", label: "Pain Points" },
			{ id: "p1_rapport_discovery_commitment", label: "Rapport, Discovery & Commitment" },
		],
	},
	{
		id: "p2",
		label: "Page 2 - Overview",
		sections: [
			{ id: "p2_performance_graph", label: "Performance Graph" },
			{ id: "p2_session_snapshot", label: "Session Snapshot" }
		],
	},
	{
		id: "p3",
		label: "Page 3 - Outcomes & Actions",
		sections: [
			{ id: "p3_outcomes", label: "Outcomes" },
			{ id: "p3_priority_actions", label: "Priority Actions" },
			{ id: "p3_copyable_scripts", label: "Copyable Scripts" },
		],
	},
	{
		id: "p4",
		label: "Page 4 - Signals & Competition",
		sections: [
			{ id: "p4_signals", label: "Signals" },
			{ id: "p4_price_competition", label: "Price & Competition" },
			{ id: "p4_emotional_cognitive_cues", label: "Emotional & Cognitive Cues" },
			{ id: "p4_recommended_reply", label: "Recommended Reply" },
		],
	},
	{
		id: "p5",
		label: "Page 5 - Stage Scores",
		sections: [
			{ id: "p5_stage_scoring_table", label: "Stage Scoring Table" },
		],
	},
	{
		id: "p6",
		label: "Page 6 - Transcript Analysis",
		sections: [
			{ id: "p6_key_quotes", label: "Key Quotes" },
			{ id: "p6_transcript_notes", label: "Transcript Notes" },
		],
	},
	{
		id: "p7",
		label: "Page 7 - Frameworks",
		sections: [
			{ id: "p7_meddicc", label: "MEDDICC Analysis" },
			{ id: "p7_bant", label: "BANT Qualification" },
			{ id: "p7_risk_profile", label: "Risk Profile" },
		],
	},
	{
		id: "p8",
		label: "Page 8 - Coaching",
		sections: [
			{ id: "p8_missed_opportunities", label: "Missed Opportunities" },
			{ id: "p8_coaching_playbook", label: "Coaching Playbook" },
			{ id: "p8_micro_drills", label: "Micro Drills" },
		],
	},
	{
		id: "p9",
		label: "Page 9 - Action Plan",
		sections: [
			{ id: "p9_immediate_actions", label: "Immediate Actions" },
			{ id: "p9_short_term_actions", label: "Short-term Actions" },
			{ id: "p9_success_metrics", label: "Success Metrics" },
			{ id: "p9_escalations", label: "Escalations" },
		],
	},
	{
		id: "p10",
		label: "Page 10 - Methodology",
		sections: [
			{ id: "p10_methodology", label: "Methodology" },
			{ id: "p10_raw_scores", label: "Raw Scores" },
			{ id: "p10_quality_notes", label: "Quality Notes" },
			{ id: "p10_coaching_usage", label: "Coaching Usage" },
		],
	},
];
