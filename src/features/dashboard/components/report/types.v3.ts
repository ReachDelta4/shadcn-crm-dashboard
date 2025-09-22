import type { StageDeepDive } from "./sections/StageDeepDiveSection";
import type { ObjectionItem } from "./sections/ObjectionListSection";
import type { SessionMetaFull } from "./sections/SessionMetaSlim";

export type ReportDataV3 = {
	tp_title?: string;
	tp_subtitle?: string;
	tp_deal?: string;
	tp_sessionId?: string;

	p1_exec_headline?: string;
	p1_exec_synopsis?: string;
	p1_meta_full?: SessionMetaFull;
	p1_key_points?: string[];
	p1_pains?: string[];
	p1_buying_signals?: string[];
	p1_objections_handled?: ObjectionItem[];
	p1_action_items?: { id: string; title: string; owner?: string; due?: string; priority?: "Low"|"Medium"|"High" }[];
	p1_deal_health?: { score?: number; rationale?: string };

	p2_context_snapshot?: string;
	p2_high_priority?: string[];
	p2_medium_priority?: string[];
	p2_info_items?: string[];
	p2_risks_concerns?: { area: string; impact?: "High"|"Medium"|"Low"; likelihood?: "High"|"Medium"|"Low"; rationale?: string }[];
	p2_short_summary?: string;

	p3_deal_health_summary?: { score?: number; status?: string };
	p3_meddicc?: any;
	p3_bant?: { rows?: { key: string; status?: string; notes?: string }[] };
	p3_missed_opportunities?: string[];
	p3_improvements?: string[];
	p3_short_reco?: string;

	p4_stage_eval?: { stage: string; handled: "yes"|"no"|"partial"; note?: string; score: number }[];
	p4_pivotal_points?: { ts: string; reason: string; quote?: string }[];
	p4_takeaway?: string;

	p5_stage_a?: StageDeepDive[];
	p5_stage_b?: StageDeepDive[];
	p6_stage_c?: StageDeepDive[];
	p6_stage_d?: StageDeepDive[];
	p7_stage_e?: StageDeepDive[];
	p7_stage_f?: StageDeepDive[];
	p8_stage_g?: StageDeepDive[];
	p8_stage_h?: StageDeepDive[];
	p9_stage_i?: StageDeepDive[];
	p9_stage_j?: StageDeepDive[];
	p10_stage_k?: StageDeepDive[];
	p10_stage_l?: StageDeepDive[];

	apx_scoring_rubric?: string[];
	apx_data_flags?: string[];

	// Optional narratives (Markdown-in-JSON) - NOT REQUIRED for backward compatibility
	narratives?: {
		executive_summary?: NarrativeSection;
		meeting_summary?: NarrativeSectionWithTopics;
		technical_evaluation?: NarrativeSection;
		competitive_landscape?: NarrativeSectionWithCompetitors;
		stage_narratives?: {
			discovery?: StageNarrative;
			qualification?: QualificationNarrative;
			proposal?: StageNarrative;
			negotiation?: StageNarrative;
			closing?: StageNarrative;
		};
		next_steps_narrative?: NarrativeSection;
	};

	// Optional layout hints for print optimization
	layout_hints?: {
		mode?: 'mini' | 'full';
		density?: 'compact' | 'normal' | 'dense';
		sections?: Record<string, {
			allow_page_break_inside?: boolean;
			print_columns?: number;
			min_chars?: number;
		}>;
	};
};

// Narrative type definitions
export interface NarrativeSection {
	content: string;
	metadata?: {
		generated_at?: string;
		word_count?: number;
		key_terms?: string[];
		sentiment?: number;
	};
}

export interface NarrativeSectionWithTopics extends NarrativeSection {
	metadata?: NarrativeSection['metadata'] & {
		topics_covered?: string[];
		participants_mentioned?: string[];
	};
}

export interface NarrativeSectionWithCompetitors extends NarrativeSection {
	metadata?: NarrativeSection['metadata'] & {
		competitors_mentioned?: string[];
	};
}

export interface StageNarrative {
	summary: string;
	key_findings?: string;
	concerns?: string;
}

export interface QualificationNarrative extends StageNarrative {
	bant_analysis?: string;
	meddicc_analysis?: string;
}
