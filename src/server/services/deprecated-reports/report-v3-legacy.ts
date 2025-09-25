// DEPRECATED COPY - DO NOT IMPORT IN NEW CODE
// Original file: src/server/services/report-v3.ts
// Keeping for archival/reference only.

import { ReportsV3Repository } from '@/server/repositories/reports-v3'
import { SessionsRepository } from '@/server/repositories/sessions'
import { TranscriptsRepository } from '@/server/repositories/transcripts'

// Enterprise-grade JSON schema with strict constraints
const REPORT_V3_JSON_SCHEMA: any = {
	type: 'object',
	additionalProperties: false,
	required: [
		'tp_title', 'tp_subtitle', 'tp_deal', 'tp_sessionId',
		'p1_exec_headline', 'p1_exec_synopsis', 'p1_meta_full', 'p1_key_points', 'p1_pains', 'p1_buying_signals', 'p1_objections_handled', 'p1_action_items', 'p1_deal_health',
		'p2_context_snapshot', 'p2_high_priority', 'p2_medium_priority', 'p2_info_items', 'p2_risks_concerns', 'p2_short_summary',
		'p3_deal_health_summary', 'p3_meddicc', 'p3_bant', 'p3_missed_opportunities', 'p3_improvements', 'p3_short_reco',
		'p4_stage_eval', 'p4_pivotal_points', 'p4_takeaway',
		'p5_stage_a', 'p5_stage_b', 'p6_stage_c', 'p6_stage_d', 'p7_stage_e', 'p7_stage_f', 'p8_stage_g', 'p8_stage_h', 'p9_stage_i', 'p9_stage_j', 'p10_stage_k', 'p10_stage_l',
		'apx_scoring_rubric', 'apx_data_flags'
	],
	properties: {
		// Title page
		tp_title: { type: 'string', minLength: 1 },
		tp_subtitle: { type: 'string', minLength: 1 },
		tp_deal: { type: 'string', minLength: 1 },
		tp_sessionId: { type: 'string', minLength: 1 },
		
		// Page 1 - Executive Summary
		p1_exec_headline: { type: 'string', minLength: 1 },
		p1_exec_synopsis: { type: 'string', minLength: 1 },
		p1_meta_full: {
			type: 'object',
			additionalProperties: false,
			required: ['date', 'time', 'duration', 'rep', 'prospect', 'channel', 'transcriptQuality'],
			properties: {
				date: { type: 'string', minLength: 1 },
				time: { type: 'string', minLength: 1 },
				duration: { type: 'string', minLength: 1 },
				rep: {
					type: 'object',
					additionalProperties: false,
					required: ['name'],
					properties: {
						name: { type: 'string', minLength: 1 },
						role: { type: 'string' },
						team: { type: 'string' }
					}
				},
				prospect: {
					type: 'object',
					additionalProperties: false,
					required: ['name'],
					properties: {
						name: { type: 'string', minLength: 1 },
						role: { type: 'string' },
						company: { type: 'string' }
					}
				},
				channel: { type: 'string', minLength: 1 },
				transcriptQuality: { type: 'string', minLength: 1 }
			}
		},
		p1_key_points: { type: 'array', minItems: 3, items: { type: 'string', minLength: 1 } },
		p1_pains: { type: 'array', minItems: 2, items: { type: 'string', minLength: 1 } },
		p1_buying_signals: { type: 'array', minItems: 2, items: { type: 'string', minLength: 1 } },
		p1_objections_handled: {
			type: 'array',
			minItems: 2,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['label', 'handled'],
				properties: {
					label: { type: 'string', minLength: 1 },
					handled: { type: 'string', enum: ['yes', 'no', 'partial'] }
				}
			}
		},
		p1_action_items: {
			type: 'array',
			minItems: 3,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['id', 'title'],
				properties: {
					id: { type: 'string', minLength: 1 },
					title: { type: 'string', minLength: 1 },
					owner: { type: 'string' },
					due: { type: 'string' },
					priority: { type: 'string', enum: ['Low', 'Medium', 'High'] }
				}
			}
		},
		p1_deal_health: {
			type: 'object',
			additionalProperties: false,
			required: ['score', 'rationale'],
			properties: {
				score: { type: 'integer', minimum: 0, maximum: 100 },
				rationale: { type: 'string', minLength: 1 }
			}
		},

		// Page 2 - Discussion Highlights
		p2_context_snapshot: { type: 'string', minLength: 1 },
		p2_high_priority: { type: 'array', minItems: 3, items: { type: 'string', minLength: 1 } },
		p2_medium_priority: { type: 'array', minItems: 2, items: { type: 'string', minLength: 1 } },
		p2_info_items: { type: 'array', minItems: 3, items: { type: 'string', minLength: 1 } },
		p2_risks_concerns: {
			type: 'array',
			minItems: 3,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['area'],
				properties: {
					area: { type: 'string', minLength: 1 },
					impact: { type: 'string', enum: ['High', 'Medium', 'Low'] },
					likelihood: { type: 'string', enum: ['High', 'Medium', 'Low'] },
					rationale: { type: 'string' }
				}
			}
		},
		p2_short_summary: { type: 'string', minLength: 1 },

		// Page 3 - Deal Health & Outcomes
		p3_deal_health_summary: {
			type: 'object',
			additionalProperties: false,
			required: ['score', 'status'],
			properties: {
				score: { type: 'integer', minimum: 0, maximum: 100 },
				status: { type: 'string', minLength: 1 }
			}
		},
		p3_meddicc: {
			type: 'object',
			additionalProperties: false,
			required: ['metrics', 'economicBuyer', 'decisionCriteria', 'decisionProcess', 'identifyPain', 'competition', 'champion'],
			properties: {
				metrics: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } } }
				},
				economicBuyer: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'string', minLength: 1 } }
				},
				decisionCriteria: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } } }
				},
				decisionProcess: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'string', minLength: 1 } }
				},
				identifyPain: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'string', minLength: 1 } }
				},
				competition: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'array', items: { type: 'string', minLength: 1 } } }
				},
				champion: {
					type: 'object',
					additionalProperties: false,
					required: ['value'],
					properties: { value: { type: 'string', minLength: 1 } }
				}
			}
		},
		p3_bant: {
			type: 'object',
			additionalProperties: false,
			required: ['rows'],
			properties: {
				rows: {
					type: 'array',
					minItems: 4,
					items: {
						type: 'object',
						additionalProperties: false,
						required: ['key'],
						properties: {
							key: { type: 'string', minLength: 1 },
							status: { type: 'string' },
							notes: { type: 'string' }
						}
					}
				}
			}
		},
		p3_missed_opportunities: { type: 'array', minItems: 2, items: { type: 'string', minLength: 1 } },
		p3_improvements: { type: 'array', minItems: 2, items: { type: 'string', minLength: 1 } },
		p3_short_reco: { type: 'string', minLength: 1 },
		
		// Page 4 - Call Stages Overview
		p4_stage_eval: {
			type: 'array',
			minItems: 11,
			maxItems: 11,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['stage', 'handled', 'score'],
				properties: {
					stage: { type: 'string', minLength: 1 },
					handled: { type: 'string', enum: ['yes', 'no', 'partial'] },
					note: { type: 'string' },
					score: { type: 'integer', minimum: 0, maximum: 10 }
				}
			}
		},
		p4_pivotal_points: {
			type: 'array',
			minItems: 1,
			items: {
				type: 'object',
				additionalProperties: false,
				required: ['ts', 'reason'],
				properties: {
					ts: { type: 'string', minLength: 1 },
					reason: { type: 'string', minLength: 1 },
					quote: { type: 'string' }
				}
			}
		},
		p4_takeaway: { type: 'string', minLength: 1 },
		
		// Pages 5-10 - Stage Deep Dives
		p5_stage_a: { $ref: '#/$defs/stageDeepDiveArray' },
		p5_stage_b: { $ref: '#/$defs/stageDeepDiveArray' },
		p6_stage_c: { $ref: '#/$defs/stageDeepDiveArray' },
		p6_stage_d: { $ref: '#/$defs/stageDeepDiveArray' },
		p7_stage_e: { $ref: '#/$defs/stageDeepDiveArray' },
		p7_stage_f: { $ref: '#/$defs/stageDeepDiveArray' },
		p8_stage_g: { $ref: '#/$defs/stageDeepDiveArray' },
		p8_stage_h: { $ref: '#/$defs/stageDeepDiveArray' },
		p9_stage_i: { $ref: '#/$defs/stageDeepDiveArray' },
		p9_stage_j: { $ref: '#/$defs/stageDeepDiveArray' },
		p10_stage_k: { $ref: '#/$defs/stageDeepDiveArray' },
		p10_stage_l: { $ref: '#/$defs/stageDeepDiveArray' },
		
		// Appendix
		apx_scoring_rubric: { type: 'array', minItems: 4, items: { type: 'string', minLength: 1 } },
		apx_data_flags: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
	},
	$defs: {
		stageDeepDive: {
			type: 'object',
			additionalProperties: false,
			required: ['stageName'],
			properties: {
				stageName: { type: 'string', minLength: 1 },
				objective: { type: 'string' },
				indicators: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
				observed: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
				score: { type: 'integer', minimum: 0, maximum: 100 },
				weight: { type: 'integer', minimum: 0, maximum: 100 },
				mistakes: { type: 'array', items: { type: 'string', minLength: 1 } },
				whatToSay: { type: 'array', items: { type: 'string', minLength: 1 } },
				positives: { type: 'array', items: { type: 'string', minLength: 1 } },
				coaching: { type: 'array', items: { type: 'string', minLength: 1 } },
				quickFix: { type: 'string' },
				actions: {
					type: 'array',
					items: {
						type: 'object',
						additionalProperties: false,
						required: ['id', 'title'],
						properties: {
							id: { type: 'string', minLength: 1 },
							title: { type: 'string', minLength: 1 },
							owner: { type: 'string' },
							due: { type: 'string' }
						}
					}
				}
			}
		},
		stageDeepDiveArray: {
			type: 'array',
			minItems: 1,
			items: { $ref: '#/$defs/stageDeepDive' }
		},
		
		// Narrative schema definitions
		narrativeSection: {
			type: 'object',
			additionalProperties: false,
			required: ['content'],
			properties: {
				content: { type: 'string', minLength: 1 },
				metadata: {
					type: 'object',
					additionalProperties: false,
					properties: {
						generated_at: { type: 'string' },
						word_count: { type: 'integer', minimum: 0 },
						key_terms: { type: 'array', items: { type: 'string' } },
						sentiment: { type: 'number', minimum: -1, maximum: 1 }
					}
				}
			}
		},
		
		narrativeSectionWithTopics: {
			type: 'object',
			additionalProperties: false,
			required: ['content'],
			properties: {
				content: { type: 'string', minLength: 1 },
				metadata: {
					type: 'object',
					additionalProperties: false,
					properties: {
						generated_at: { type: 'string' },
						word_count: { type: 'integer', minimum: 0 },
						key_terms: { type: 'array', items: { type: 'string' } },
						sentiment: { type: 'number', minimum: -1, maximum: 1 },
						topics_covered: { type: 'array', items: { type: 'string' } },
						participants_mentioned: { type: 'array', items: { type: 'string' } }
					}
				}
			}
		},
		
		narrativeSectionWithCompetitors: {
			type: 'object',
			additionalProperties: false,
			required: ['content'],
			properties: {
				content: { type: 'string', minLength: 1 },
				metadata: {
					type: 'object',
					additionalProperties: false,
					properties: {
						generated_at: { type: 'string' },
						word_count: { type: 'integer', minimum: 0 },
						key_terms: { type: 'array', items: { type: 'string' } },
						sentiment: { type: 'number', minimum: -1, maximum: 1 },
						competitors_mentioned: { type: 'array', items: { type: 'string' } }
					}
				}
			}
		},
		
		stageNarrative: {
			type: 'object',
			additionalProperties: false,
			required: ['summary'],
			properties: {
				summary: { type: 'string', minLength: 1 },
				key_findings: { type: 'string' },
				concerns: { type: 'string' }
			}
		},
		
		qualificationNarrative: {
			type: 'object',
			additionalProperties: false,
			required: ['summary'],
			properties: {
				summary: { type: 'string', minLength: 1 },
				bant_analysis: { type: 'string' },
				meddicc_analysis: { type: 'string' }
			}
		}
	}
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildSystemPrompt(): string {
	return [
		'You are an enterprise sales analyst. Return ONLY compact JSON matching the provided json_schema. No extra text.',
		'CRITICAL: All 42 fields are mandatory. Follow exact minimums with ENHANCED DENSITY TARGETS:',
		'',
		'CORE CONTENT DENSITY REQUIREMENTS:',
		'- p1_exec_headline: 80-120 characters (rich, engaging summary)',
		'- p1_exec_synopsis: 180-280 characters (comprehensive context)',
		'- p1_key_points≥4 items, 45-65 chars each (detailed, specific insights)',
		'- p1_pains≥3 items, 40-60 chars each (quantified pain points)', 
		'- p1_buying_signals≥3 items, 35-55 chars each (specific behaviors)',
		'- p1_objections_handled≥2, p1_action_items≥4 (expanded coverage)',
		'',
		'PRIORITY SECTIONS (Print Optimization):',
		'- p2_context_snapshot: 200-320 characters (rich situational context)',
		'- p2_high_priority≥4 items, 50-70 chars each (actionable priorities)',
		'- p2_medium_priority≥3 items, 40-60 chars each (supporting actions)',
		'- p2_info_items≥4 items, 35-50 chars each (comprehensive coverage)',
		'- p2_risks_concerns≥3 items with detailed impact/likelihood analysis',
		'- p2_short_summary: 180-280 characters (thorough synthesis)',
		'',
		'ANALYSIS SECTIONS (Enhanced Depth):',
		'- p3_missed_opportunities≥3 items, 60-80 chars each (strategic insights)',
		'- p3_improvements≥3 items, 55-75 chars each (actionable recommendations)',
		'- p3_short_reco: 200-300 characters (comprehensive recommendations)',
		'- p4_takeaway: 220-320 characters (strategic summary with next steps)',
		'',
		'STAGE EVALUATION (Mandatory Structure):',
		'- p4_stage_eval: EXACTLY 11 stages ["Greetings","Introduction","Customer Success Stories","Discovery","Product Details","Trust Building","Objection Handling","Buying‑Signal Capitalization","Negotiation","Timeline","Closing / Registration"] with handled∈{yes,no,partial} and score∈[0,10]',
		'- Each p5..p10 stage array≥2 items with ALL fields populated (indicators/observed/mistakes/whatToSay/positives/coaching)',
		'- Stage content: indicators≥3, observed≥3, mistakes≥2, whatToSay≥2, positives≥2, coaching≥2',
		'- p3_bant.rows≥4, apx_scoring_rubric≥5, apx_data_flags≥2',
		'',
		'NARRATIVES (ENHANCED DENSITY - Strongly Recommended):',
		'Include "narratives" object with markdown-formatted content for premium user experience:',
		'- executive_summary.content: 120-180 words, use **bold** for metrics, ## headings, bullet points',
		'- meeting_summary.content: 180-250 words, include > blockquotes, structured sections',
		'- technical_evaluation.content: 150-220 words, use ✅/❌, ### subheadings, detailed analysis',
		'- competitive_landscape.content: 140-200 words, comprehensive competitive analysis',
		'- stage_narratives.discovery.summary: 80-120 words detailed narrative',
		'- stage_narratives.qualification.bant_analysis: 120-180 words rich BANT narrative',
		'- stage_narratives.qualification.meddicc_analysis: 150-220 words comprehensive MEDDICC',
		'- next_steps_narrative.content: 150-220 words detailed action plan with timelines',
		'',
		'LAYOUT OPTIMIZATION (Required for Print):',
		'Include "layout_hints" with mode="full", density="dense" for maximum page utilization:',
		'- Set allow_page_break_inside=true for long content sections',
		'- Use print_columns=2 for list-heavy sections to reduce whitespace',
		'- Set min_chars targets per section for content validation',
		'',
		'CONTENT QUALITY STANDARDS:',
		'- Use specific numbers, percentages, and quantified metrics',
		'- Include participant names, company details, and technical specifics',
		'- Avoid generic phrases like "Not discussed" - expand with logical context',
		'- Fill ALL available content space with valuable, actionable insights',
		'- Prioritize density over brevity - comprehensive analysis expected',
		'',
		'For missing data: Generate logical, contextually appropriate content based on available information rather than placeholders.'
	].join('\n')
}

function assembleUserPrompt(session: any, transcripts: any[], extras: { summary?: any; aiMessages?: any[]; coaching?: any[]; mainAnalysis?: any } = {}): string {
	const parts: string[] = []
	parts.push(`# SESSION\nID: ${session?.id}\nType: ${session?.type || session?.session_type || ''}\nStartedAt: ${session?.started_at || ''}`)
	if (extras.summary) parts.push(`# SUMMARY\n${JSON.stringify(extras.summary)}`)
	if (extras.aiMessages && extras.aiMessages.length) parts.push(`# AI_MESSAGES\n${JSON.stringify(extras.aiMessages)}`)
	if (extras.coaching && extras.coaching.length) parts.push(`# COACHING_EVENTS\n${JSON.stringify(extras.coaching)}`)
	if (extras.mainAnalysis) parts.push(`# MAIN_ANALYSIS\n${JSON.stringify(extras.mainAnalysis)}`)
	const allSegments = transcripts.map(t => ({ ts: t.timestamp, speaker: t.speaker, text: t.content_enc }))
	parts.push(`# TRANSCRIPTS\n${JSON.stringify(allSegments)}`)
	return parts.join('\n\n')
}

export async function generateReportV3Tabs(supabase: any, userId: string, sessionId: string): Promise<void> {
	throw new Error('Deprecated service - do not use')
}
