import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { SessionsRepository } from '@/server/repositories/sessions'
import { TranscriptsRepository } from '@/server/repositories/transcripts'
import { chatWithTools, ToolDefinition, ChatMessage, ChatToolHandlerResult } from '@/server/services/openrouter'

export interface ChanceOfSaleDecision {
	action: 'update' | 'skip'
	reason: string
	sections?: string[]
}

function extractChanceSegment(markdown?: string | null): string | null {
	if (!markdown) return null
	const startMarker = '<!-- TAB: CHANCE OF SALE -->'
	const endMarker = '<!-- /TAB: CHANCE OF SALE -->'
	const start = markdown.indexOf(startMarker)
	const end = markdown.indexOf(endMarker)
	if (start === -1 || end === -1 || end <= start) return null
	return markdown.slice(start, end + endMarker.length)
}

function summarizeTranscripts(transcripts: any[]) {
	const totalSegments = transcripts.length
	const speakers = Array.from(new Set(transcripts.map((t: any) => t.speaker).filter(Boolean)))
	const totalChars = transcripts.reduce((sum, t) => sum + ((t.content_enc || t.text_enc || '') as string).length, 0)
	const lastSegments = transcripts.slice(-Math.min(5, totalSegments)).map((t: any) => ({
		ts: t.timestamp || t.created_at,
		speaker: t.speaker,
		text: String(t.content_enc || t.text_enc || '').slice(0, 280),
	}))
	return { totalSegments, speakers, totalChars, lastSegments }
}

export async function decideChanceOfSaleUpdate(
	supabase: any,
	userId: string,
	sessionId: string
): Promise<ChanceOfSaleDecision> {
	const sessionsRepo = new SessionsRepository(supabase)
	const transcriptsRepo = new TranscriptsRepository(supabase)
	const reportsRepo = new ReportsV3TabsRepository(supabase)

	const [session, transcripts, report] = await Promise.all([
		sessionsRepo.findById(sessionId, userId),
		transcriptsRepo.findBySessionId(sessionId, userId),
		reportsRepo.findBySessionId(sessionId, userId),
	])

	const chanceSegment = extractChanceSegment((report?.report as any)?.markdown)
	const transcriptSummary = summarizeTranscripts(transcripts)

	const tools: ToolDefinition[] = [
		{
			type: 'function',
			function: {
				name: 'skip_chance_of_sale_update',
				description: 'Skip updating chance-of-sale when no material changes warrant a refresh. Must provide a clear reason.',
				parameters: {
					type: 'object',
					properties: {
						reason: { type: 'string', description: 'Short explanation of why the chance-of-sale report should remain unchanged.' }
					},
					required: ['reason'],
				},
			},
		},
		{
			type: 'function',
			function: {
				name: 'request_chance_of_sale_update',
				description: 'Trigger a chance-of-sale update when meaningful information changed.',
				parameters: {
					type: 'object',
					properties: {
						reason: { type: 'string', description: 'Succinct justification for running the update.' },
						sections: {
							type: 'array',
							items: { type: 'string' },
							description: 'Optional list of sections (e.g., DEAL_HEALTH_PIPELINE, BANT, BOOSTERS_BLOCKERS) that require updates.',
						},
					},
					required: ['reason'],
				},
			},
		},
	]

	const decisionState: { value?: ChanceOfSaleDecision } = {}

	const handlers = {
		skip_chance_of_sale_update: async (args: any): Promise<ChatToolHandlerResult> => {
			decisionState.value = {
				action: 'skip',
				reason: String(args?.reason || 'Model determined no meaningful change.'),
			}
			return { content: 'Skipping chance-of-sale update.' }
		},
		request_chance_of_sale_update: async (args: any): Promise<ChatToolHandlerResult> => {
			const sections = Array.isArray(args?.sections) ? args.sections.map((s: any) => String(s)) : undefined
			decisionState.value = {
				action: 'update',
				reason: String(args?.reason || 'Model requested a refresh.'),
				sections: sections && sections.length > 0 ? sections : undefined,
			}
			return { content: 'Chance-of-sale update requested.' }
		},
	}

	const systemPrompt = `You are a revenue operations analyst. Review session context and decide whether the chance-of-sale report needs updating.
- Call exactly one tool.
- If no material change is found, call skip_chance_of_sale_update with a concise reason.
- If an update is warranted, call request_chance_of_sale_update and specify the most impacted sections.
- Consider transcript volume, speaker activity, and any shifts from the previous report.`

	const context = {
		session: session ? {
			id: session.id,
			type: session.type,
			status: session.status,
			started_at: session.started_at,
			ended_at: session.ended_at,
		} : null,
		transcript_summary: transcriptSummary,
		previous_chance_of_sale_excerpt: chanceSegment?.slice(0, 2000) || null,
	}

	const messages: ChatMessage[] = [
		{ role: 'system', content: systemPrompt },
		{ role: 'user', content: `SESSION_ID: ${sessionId}\nCONTEXT:\n${JSON.stringify(context, null, 2)}` },
	]

	await chatWithTools({
		model: process.env.OPENROUTER_TOOL_MODEL || process.env.OPENROUTER_MODEL || 'gpt-4o-mini',
		messages,
		tools,
		handlers,
		parallelToolCalls: false,
		maxToolIterations: 1,
		returnOnToolCall: true,
		providerSort: 'latency',
		temperature: 0,
	})

	if (decisionState.value) {
		return decisionState.value
	}

	// Fallback heuristics
	if (!chanceSegment) {
		return {
			action: 'update',
			reason: 'No previous chance-of-sale report exists.',
		}
	}
	if (transcriptSummary.totalSegments === 0) {
		return {
			action: 'skip',
			reason: 'No transcripts available for this session.',
		}
	}
	return {
		action: 'update',
		reason: 'Defaulting to update when model returned no explicit decision.',
	}
}
