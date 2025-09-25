import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { SessionsRepository } from '@/server/repositories/sessions'
import { TranscriptsRepository } from '@/server/repositories/transcripts'
import { chatJsonSchema } from '@/server/services/openrouter'

// Enterprise-grade JSON schema for the 3 tabs with markdown-in-JSON structure
const REPORT_V3_TABS_JSON_SCHEMA: any = {
	type: 'object',
	additionalProperties: false,
	required: ['schema_version', 'executive_summary', 'chance_of_sale', 'sales_rep_performance'],
	properties: {
		schema_version: { type: 'string', enum: ['1.0'] },
		
		// Executive Summary Tab - Rich narrative with key metrics
		executive_summary: {
			type: 'object',
			additionalProperties: false,
			required: ['content', 'metadata', 'key_highlights'],
			properties: {
				content: { type: 'string', minLength: 200 }, // Markdown narrative
				metadata: {
					type: 'object',
					properties: {
						generated_at: { type: 'string' },
						word_count: { type: 'number' },
						key_terms: { type: 'array', items: { type: 'string' } },
						sentiment: { type: 'number', minimum: -1, maximum: 1 }
					}
				},
				key_highlights: {
					type: 'array',
					minItems: 3,
					items: { type: 'string', minLength: 30 }
				},
				deal_snapshot: {
					type: 'object',
					properties: {
						value: { type: 'string' },
						stage: { type: 'string' },
						next_meeting: { type: 'string' },
						priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
					}
				}
			}
		},

		// Chance of Sale Tab - Scoring with rich analysis
		chance_of_sale: {
			type: 'object',
			additionalProperties: false,
			required: ['overall_score', 'content', 'factors', 'recommendations'],
			properties: {
				overall_score: { type: 'number', minimum: 0, maximum: 100 },
				confidence_level: { type: 'string', enum: ['low', 'medium', 'high'] },
				content: { type: 'string', minLength: 150 }, // Markdown analysis narrative
				factors: {
					type: 'object',
					required: ['boosters', 'blockers'],
					properties: {
						boosters: {
							type: 'array',
							minItems: 2,
							items: {
								type: 'object',
								required: ['factor', 'impact', 'description'],
								properties: {
									factor: { type: 'string', minLength: 10 },
									impact: { type: 'number', minimum: 1, maximum: 10 },
									description: { type: 'string', minLength: 30 }
								}
							}
						},
						blockers: {
							type: 'array',
							minItems: 1,
							items: {
								type: 'object',
								required: ['factor', 'severity', 'description'],
								properties: {
									factor: { type: 'string', minLength: 10 },
									severity: { type: 'number', minimum: 1, maximum: 10 },
									description: { type: 'string', minLength: 30 },
									mitigation: { type: 'string' }
								}
							}
						}
					}
				},
				recommendations: {
					type: 'object',
					required: ['content', 'next_steps'],
					properties: {
						content: { type: 'string', minLength: 100 }, // Markdown recommendations
						next_steps: {
							type: 'array',
							minItems: 2,
							items: {
								type: 'object',
								required: ['action', 'timeline', 'owner'],
								properties: {
									action: { type: 'string', minLength: 20 },
									timeline: { type: 'string' },
									owner: { type: 'string' },
									priority: { type: 'string', enum: ['low', 'medium', 'high'] }
								}
							}
						}
					}
				}
			}
		},

		// Sales Rep Performance Tab - Coaching with detailed analysis
		sales_rep_performance: {
			type: 'object',
			additionalProperties: false,
			required: ['overall_score', 'content', 'stage_performance', 'coaching_areas'],
			properties: {
				overall_score: { type: 'number', minimum: 0, maximum: 100 },
				content: { type: 'string', minLength: 200 }, // Markdown performance narrative
				stage_performance: {
					type: 'array',
					minItems: 5,
					items: {
						type: 'object',
						required: ['stage', 'score', 'feedback'],
						properties: {
							stage: { type: 'string', minLength: 5 },
							score: { type: 'number', minimum: 0, maximum: 10 },
							feedback: { type: 'string', minLength: 50 }, // Markdown feedback
							strengths: { type: 'array', items: { type: 'string', minLength: 20 } },
							improvements: { type: 'array', items: { type: 'string', minLength: 20 } }
						}
					}
				},
				coaching_areas: {
					type: 'object',
					required: ['content', 'priorities'],
					properties: {
						content: { type: 'string', minLength: 150 }, // Markdown coaching narrative
						priorities: {
							type: 'array',
							minItems: 3,
							items: {
								type: 'object',
								required: ['area', 'urgency', 'specific_actions'],
								properties: {
									area: { type: 'string', minLength: 15 },
									urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
									specific_actions: { type: 'string', minLength: 50 }, // Markdown actions
									resources: { type: 'array', items: { type: 'string' } }
								}
							}
						}
					}
				}
			}
		},

		// Layout hints for print optimization
		layout_hints: {
			type: 'object',
			properties: {
				mode: { type: 'string', enum: ['compact', 'full'] },
				density: { type: 'string', enum: ['loose', 'normal', 'dense'] },
				sections: {
					type: 'object',
					properties: {
						executive_summary: {
							type: 'object',
							properties: {
								allow_page_break_inside: { type: 'boolean' },
								print_columns: { type: 'number', minimum: 1, maximum: 3 },
								min_chars: { type: 'number' }
							}
						},
						chance_of_sale: {
							type: 'object',
							properties: {
								allow_page_break_inside: { type: 'boolean' },
								print_columns: { type: 'number', minimum: 1, maximum: 3 },
								min_chars: { type: 'number' }
							}
						},
						sales_rep_performance: {
							type: 'object',
							properties: {
								allow_page_break_inside: { type: 'boolean' },
								print_columns: { type: 'number', minimum: 1, maximum: 3 },
								min_chars: { type: 'number' }
							}
						}
					}
				}
			}
		}
	}
}

function buildTabsSystemPrompt(): string {
	return [
		'SYSTEM INSTRUCTION:',
		'You are an elite **Sales Performance Analyst** with expertise in:',
		'- Clinical Psychology: detecting behavioral patterns and subtle cues',
		'- Persuasion Science: Cialdini, Robert Greene, Hormozi frameworks',
		'- Fortune 500 & MNC Sales: Enterprise deal mechanics',
		'- VC & Startup Evaluation: Y Combinator, Sequoia pattern matching',
		'- NLP & Precision Language: scripts, micro-commitments, objection handling',
		'',
		'Your task: Analyze the transcript and generate a **3-tab Markdown report** (Obsidian-ready). Do **NOT assume your own format**. Follow exact delimiters and section structure below. Include **paragraphs for narrative**, **bullet points for quick info**, **blockquotes for quotes**, **tables for frameworks**, and **text-art bars for scoring**. Include **timestamps** wherever available.',
		'',
		'Focus on:',
		'- Subtle emotions, tone, micro-behaviors, implied objections, hidden opportunities, and buying signals',
		'- Scoring mathematically (Deal Score, Rep Performance) to avoid random results',
		'- Scripts, actionable recommendations, and exact phrasing',
		'',
		'---',
		'',
		'INPUT:',
		'{{TRANSCRIPT}}',
		'',
		'Metadata (optional): `{{REP_NAME}}`, `{{PROSPECT_NAME}}`, `{{COMPANY}}`, `{{CALL_DATE}}`, `{{CALL_TYPE}}`',
		'',
		'---',
		'',
		'OUTPUT STRUCTURE:',
		'',
		'<!-- TAB: EXECUTIVE SUMMARY -->',
		'# Executive Summary',
		'',
		'**Call Overview (Paragraph)**  ',
		'Describe what happened in the call: sequence, tone, flow, rep approach, prospect engagement, overall alignment.',
		'',
		'**Pain Points of the Prospect (Bullets + timestamps)**  ',
		'> Use blockquotes for evidence.',
		'',
		'**Objections Raised (Bullets + timestamps)**  ',
		'> Include all objections verbatim.',
		'',
		'**Buying Signals (Bullets + timestamps)**  ',
		'> Include verbal or implied indications of interest.',
		'',
		'**Key Details to Remember (Bullets)**  ',
		'- Team size, decision makers, priorities, budget, timelines.',
		'',
		'**Missed Opportunities (Bullets)**  ',
		'- Areas the rep could have probed further or strengthened the deal.',
		'',
		'**Areas to Improve (Bullets)**  ',
		'- Specific, actionable points for the rep.',
		'',
		'**To-Do List / Next Steps (Bullets with owner & deadline)**  ',
		'- Include micro-scripts if needed.',
		'',
		'**Deal Score (Text-Art Bar, 0–100)**  ',
		'Deal Score: [████████░░░░] 72/100',
		'',
		'<!-- /TAB: EXECUTIVE SUMMARY -->',
		'',
		'---',
		'',
		'<!-- TAB: CHANCE OF SALE -->',
		'# Chance of Sale',
		'',
		'**Deal Health Pipeline (Paragraph + Bullets)**  ',
		'- Assess readiness, engagement, boosters, blockers.',
		'',
		'**MEDDICC Table**',
		'| Dimension        | Observations | Score (%) |',
		'|-----------------|--------------|-----------|',
		'| Metrics          | …            | …         |',
		'| Economic Buyer   | …            | …         |',
		'| Decision Criteria| …            | …         |',
		'| Decision Process | …            | …         |',
		'| Identify Pain    | …            | …         |',
		'| Champion         | …            | …         |',
		'| Competition      | …            | …         |',
		'',
		'**BANT Table**',
		'| Dimension | Observations | Score (%) |',
		'|----------|--------------|-----------|',
		'| Budget   | …            | …         |',
		'| Authority| …            | …         |',
		'| Need     | …            | …         |',
		'| Timeline | …            | …         |',
		'',
		'**Deal Score Calculation (Formula)**  ',
		'Deal Score = (0.25Metrics + 0.15EconomicBuyer + 0.10DecisionCriteria + 0.10DecisionProcess + 0.15IdentifyPain + 0.10Champion + 0.05Competition + 0.05Budget + 0.05*Authority)',
		'' ,
		'',
		'**Probability of Sale (Paragraph + %)**  ',
		'Explain risk factors, boosters, and blockers.',
		'',
		'**Boosters vs Blockers (Bullets)**  ',
		'- Clearly separate positive vs negative influences.',
		'',
		'**Next Steps to Close (3–5 bullets with owner, deadline, micro-scripts)**',
		'',
		'<!-- /TAB: CHANCE OF SALE -->',
		'',
		'---',
		'',
		'<!-- TAB: SALES REP PERFORMANCE -->',
		'# Sales Rep Performance (SCALPEL-X)',
		'',
		'For each SCALPEL-X dimension:',
		'',
		'- **Score (0–10)**  ',
		'- **Analysis Paragraph**: behavior, tone, strategy, alignment with prospect needs  ',
		'- **Evidence**: Blockquote with timestamp from transcript  ',
		'- **Subtle Signals / Micro-Behaviors**: tone, pacing, hedges, implied objections  ',
		'- **Coaching Recommendations (Bullets)**: exact scripts, role-play, actionable advice',
		'',
		'Dimensions:',
		'',
		'1. Situation Framing & Intent  ',
		'2. Cognitive Discovery  ',
		'3. Affective Attunement  ',
		'4. Leverage & Influence Dynamics  ',
		'5. Prescription & Value Architecture  ',
		'6. Execution & Commitment Engineering  ',
		'7. Longitudinal Insight',
		'',
		'**Overall Rep Performance Score (0–100, Text-Art Bar)**  ',
		'Sales Rep Score: [████████░░░░] 70/100',
		'' ,
		'',
		'**Strengths (3–5 bullets with timestamp evidence)**  ',
		'**Opportunities for Improvement (3–5 bullets with suggested scripts)**  ',
		'**Skill Drills / Practice Focus (3–5 bullets with scenario + improved script)**  ',
		'',
		'---',
		'',
		'OUTPUT RULES SUMMARY:',
		'- Markdown only, **strict three-tab structure**, **never deviate**  ',
		'- Paragraphs for analysis, bullets for lists, blockquotes for quotes/evidence, tables for frameworks  ',
		'- Timestamps included  ',
		'- Scoring always mathematically computed  ',
		'- All insights descriptive, crisp, actionable, inspired by psychology, persuasion, VC, MNC sales, Hormozi/Suby/Greene/Jobs/Thiel  ',
		'',
		'TRANSCRIPT PLACEHOLDER: `{{TRANSCRIPT}}`',
	].join('\n')
}

function assembleTabsUserPrompt(session: any, transcripts: any[], extras: { summary?: any; aiMessages?: any[]; coaching?: any[]; mainAnalysis?: any } = {}): string {
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

// Enterprise-grade normalizer to guarantee complete sections
function normalizeReportV3Tabs(report: any): any {
	const normalized = { ...report }
	
	// Ensure schema version
	normalized.schema_version = '1.0'
	
	// Normalize Executive Summary
	if (!normalized.executive_summary) normalized.executive_summary = {}
	const execSummary = normalized.executive_summary
	execSummary.content = execSummary.content || '## Executive Summary\n\nCall analysis in progress. Comprehensive summary will be generated based on transcript data.\n\n**Key Outcome**: Analysis pending\n\n> Detailed insights will be provided upon completion of transcript processing.'
	execSummary.metadata = execSummary.metadata || {
		generated_at: new Date().toISOString(),
		word_count: execSummary.content ? execSummary.content.split(' ').length : 0,
		key_terms: [],
		sentiment: 0
	}
	execSummary.key_highlights = ensureArrayMin(execSummary.key_highlights, 3, 'Key insight to be determined from transcript analysis')
	execSummary.deal_snapshot = execSummary.deal_snapshot || {
		value: 'To be determined',
		stage: 'Under analysis',
		next_meeting: 'Scheduling in progress',
		priority: 'medium'
	}
	
	// Normalize Chance of Sale
	if (!normalized.chance_of_sale) normalized.chance_of_sale = {}
	const chanceOfSale = normalized.chance_of_sale
	chanceOfSale.overall_score = typeof chanceOfSale.overall_score === 'number' ? 
		Math.max(0, Math.min(100, chanceOfSale.overall_score)) : 50
	chanceOfSale.confidence_level = ['low', 'medium', 'high'].includes(chanceOfSale.confidence_level) ? 
		chanceOfSale.confidence_level : 'medium'
	chanceOfSale.content = chanceOfSale.content || '## Deal Probability Analysis\n\nBased on available transcript data, this deal shows **moderate potential** with several factors influencing the outcome.\n\n### Key Considerations\n- Prospect engagement level\n- Technical fit assessment\n- Decision-making timeline\n\n> Detailed scoring analysis in progress.'
	
	// Ensure factors structure
	if (!chanceOfSale.factors) chanceOfSale.factors = {}
	chanceOfSale.factors.boosters = ensureArrayMin(chanceOfSale.factors.boosters, 2, null)
	chanceOfSale.factors.boosters = chanceOfSale.factors.boosters.map((booster: any, i: number) => ({
		factor: booster?.factor || `Positive factor ${i + 1} identified during analysis`,
		impact: typeof booster?.impact === 'number' ? Math.max(1, Math.min(10, booster.impact)) : 5,
		description: booster?.description || 'Impact assessment based on transcript analysis and engagement patterns'
	}))
	
	chanceOfSale.factors.blockers = ensureArrayMin(chanceOfSale.factors.blockers, 1, null)
	chanceOfSale.factors.blockers = chanceOfSale.factors.blockers.map((blocker: any, i: number) => ({
		factor: blocker?.factor || `Challenge ${i + 1} requiring attention`,
		severity: typeof blocker?.severity === 'number' ? Math.max(1, Math.min(10, blocker.severity)) : 4,
		description: blocker?.description || 'Risk factor identified through conversation analysis',
		mitigation: blocker?.mitigation || 'Mitigation strategy to be developed'
	}))
	
	// Ensure recommendations structure
	if (!chanceOfSale.recommendations) chanceOfSale.recommendations = {}
	chanceOfSale.recommendations.content = chanceOfSale.recommendations.content || '## Strategic Recommendations\n\nBased on the call analysis, the following actions will optimize deal progression:\n\n- **Immediate**: Address key concerns raised\n- **Short-term**: Provide requested information\n- **Long-term**: Maintain engagement momentum'
	chanceOfSale.recommendations.next_steps = ensureArrayMin(chanceOfSale.recommendations.next_steps, 2, null)
	chanceOfSale.recommendations.next_steps = chanceOfSale.recommendations.next_steps.map((step: any, i: number) => ({
		action: step?.action || `Action item ${i + 1} based on call outcome`,
		timeline: step?.timeline || 'Within 1 week',
		owner: step?.owner || 'Sales Rep',
		priority: ['low', 'medium', 'high'].includes(step?.priority) ? step.priority : 'medium'
	}))
	
	// Normalize Sales Rep Performance
	if (!normalized.sales_rep_performance) normalized.sales_rep_performance = {}
	const repPerf = normalized.sales_rep_performance
	repPerf.overall_score = typeof repPerf.overall_score === 'number' ? 
		Math.max(0, Math.min(100, repPerf.overall_score)) : 70
	repPerf.content = repPerf.content || '## Sales Representative Performance Analysis\n\nOverall performance demonstrates **solid execution** with opportunities for enhancement in key areas.\n\n### Strengths Observed\n- Professional communication style\n- Good rapport building\n- Technical knowledge demonstration\n\n### Development Areas\n- Objection handling techniques\n- Closing question timing\n- Discovery depth\n\n> Detailed coaching recommendations provided below.'
	
	// Ensure stage performance
	repPerf.stage_performance = ensureArrayMin(repPerf.stage_performance, 5, null)
	const defaultStages = ['Opening', 'Discovery', 'Presentation', 'Objection Handling', 'Closing']
	repPerf.stage_performance = repPerf.stage_performance.map((stage: any, i: number) => ({
		stage: stage?.stage || defaultStages[i] || `Stage ${i + 1}`,
		score: typeof stage?.score === 'number' ? Math.max(0, Math.min(10, stage.score)) : 7,
		feedback: stage?.feedback || `Performance in this stage shows competency with room for improvement. Specific coaching recommendations will enhance effectiveness.`,
		strengths: ensureArrayMin(stage?.strengths, 1, 'Demonstrated competency in stage execution'),
		improvements: ensureArrayMin(stage?.improvements, 1, 'Opportunity for enhanced technique application')
	}))
	
	// Ensure coaching areas
	if (!repPerf.coaching_areas) repPerf.coaching_areas = {}
	repPerf.coaching_areas.content = repPerf.coaching_areas.content || '## Coaching Priorities\n\nFocused development in these areas will significantly enhance sales effectiveness:\n\n### Primary Focus Areas\n1. **Discovery Enhancement** - Deeper questioning techniques\n2. **Objection Management** - Proactive concern addressing\n3. **Closing Confidence** - Stronger commitment requests\n\n### Development Plan\nStructured coaching sessions with role-playing exercises and real-call feedback loops.'
	repPerf.coaching_areas.priorities = ensureArrayMin(repPerf.coaching_areas.priorities, 3, null)
	repPerf.coaching_areas.priorities = repPerf.coaching_areas.priorities.map((priority: any, i: number) => ({
		area: priority?.area || `Development area ${i + 1}`,
		urgency: ['low', 'medium', 'high'].includes(priority?.urgency) ? priority.urgency : 'medium',
		specific_actions: priority?.specific_actions || `Specific coaching actions for improvement in this area, including practice exercises and feedback mechanisms.`,
		resources: ensureArrayMin(priority?.resources, 1, 'Training resource to be assigned')
	}))
	
	// Add layout hints
	normalized.layout_hints = normalized.layout_hints || {
		mode: 'full',
		density: 'dense',
		sections: {
			executive_summary: { allow_page_break_inside: true, print_columns: 1, min_chars: 200 },
			chance_of_sale: { allow_page_break_inside: true, print_columns: 2, min_chars: 150 },
			sales_rep_performance: { allow_page_break_inside: true, print_columns: 1, min_chars: 200 }
		}
	}
	
	return normalized
}

// Helper function to ensure minimum array length
function ensureArrayMin(arr: any, minLength: number, defaultItem: any): any[] {
	if (!Array.isArray(arr)) arr = []
	while (arr.length < minLength) {
		arr.push(defaultItem)
	}
	return arr
}

// Main generation function
export async function generateReportV3Tabs(supabase: any, userId: string, sessionId: string): Promise<void> {
	console.log(`[report-v3-tabs] Starting generation for session ${sessionId}`)
	
	const repo = new ReportsV3TabsRepository(supabase)
	const sessionsRepo = new SessionsRepository(supabase)
	const transcriptsRepo = new TranscriptsRepository(supabase)
	
	try {
		// Set status to running
		await repo.upsertQueued(sessionId)
		await repo.setRunning(sessionId)
		await repo.incrementAttempts(sessionId)
		
		// Fetch session and transcript data
		const session = await sessionsRepo.findById(sessionId, userId)
		if (!session) throw new Error('Session not found')
		
		const transcripts = await transcriptsRepo.findBySessionId(sessionId, userId)
		if (!transcripts?.length) throw new Error('No transcripts found')
		
		console.log(`[report-v3-tabs] Found ${transcripts.length} transcript segments`)
		
		// Build prompts
		const systemPrompt = buildTabsSystemPrompt()
		const userPrompt = assembleTabsUserPrompt(session, transcripts)
		// Call OpenRouter via shared helper
		let content: string = ''
		for (let attempt = 1; attempt <= 3; attempt++) {
			try {
				const r = await chatJsonSchema({
					model: 'qwen/qwen3-235b-a22b:free',
					messages: [
						{ role: 'system', content: systemPrompt },
						{ role: 'user', content: userPrompt },
					],
					schema: { name: 'ReportDataV3Tabs', strict: true, schema: REPORT_V3_TABS_JSON_SCHEMA },
					temperature: 0.1,
					maxTokens: 16000,
					timeoutMs: 180_000,
					debug: true,
				})
				content = r.content
				break
			} catch (err) {
				if (attempt < 3) {
					await new Promise(r => setTimeout(r, attempt * 1000))
					continue
				}
				throw err
			}
		}

		let report: any = null
		try {
			report = JSON.parse(content)
		} catch {
			try {
				const start = content.indexOf('{')
				const end = content.lastIndexOf('}')
				report = start >= 0 && end > start ? JSON.parse(content.slice(start, end + 1)) : null
			} catch {}
		}
		if (!report || typeof report !== 'object') {
			throw new Error('Invalid structured output')
		}

		const normalizedReport = normalizeReportV3Tabs(report)
		await repo.setReady(sessionId, normalizedReport)
		
		console.log(`[report-v3-tabs] Successfully generated tabs report for session ${sessionId}`)
		
	} catch (error) {
		console.error(`[report-v3-tabs] Generation failed for session ${sessionId}:`, error)
		await repo.setFailed(sessionId, (error as Error).message)
		throw error
	}
}



