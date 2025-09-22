

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
	role: ChatRole
	content: string
}

export interface JsonSchemaSpec {
	name: string
	strict: boolean
	schema: any
}

export interface ChatJsonSchemaOptions {
	model: string
	messages: ChatMessage[]
	schema: JsonSchemaSpec
	temperature?: number
	maxTokens?: number
	providerSort?: 'price' | 'quality' | 'speed'
	timeoutMs?: number
	debug?: boolean
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function buildHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
	}
	if (process.env.OPENROUTER_HTTP_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER
	if (process.env.OPENROUTER_X_TITLE) headers['X-Title'] = process.env.OPENROUTER_X_TITLE
	return headers
}

function estimateTokens(messages: ChatMessage[]): { approxTokens: number; charCount: number } {
	const charCount = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0)
	// Very rough heuristic: ~4 chars per token for English text
	const approxTokens = Math.ceil(charCount / 4)
	return { approxTokens, charCount }
}

export async function chatJsonSchema(opts: ChatJsonSchemaOptions): Promise<{ content: string; raw: any }> {
	const body: any = {
		model: opts.model,
		messages: opts.messages,
		response_format: {
			type: 'json_schema',
			json_schema: {
				name: opts.schema.name,
				strict: opts.schema.strict,
				schema: opts.schema.schema,
			},
		},
		provider: { sort: opts.providerSort || 'price' },
		temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.1,
		max_tokens: typeof opts.maxTokens === 'number' ? opts.maxTokens : 16000,
	}

	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 90_000)
	const shouldDebug = Boolean(opts.debug || process.env.OPENROUTER_DEBUG === 'true' || process.env.REPORT_DEBUG_OPENROUTER === 'true')

	const headers = buildHeaders()
	const { approxTokens, charCount } = estimateTokens(opts.messages)
	const requestSizeBytes = Buffer.byteLength(JSON.stringify(body), 'utf8')
	const t0 = Date.now()
	try {
		if (shouldDebug) {
			console.info('[openrouter] debug request', {
				model: opts.model,
				input_tokens_approx: approxTokens,
				input_chars: charCount,
				request_size_bytes: requestSizeBytes,
				provider_sort: body.provider?.sort,
				max_tokens: body.max_tokens,
				temperature: body.temperature,
			})
		}
		const res = await fetch(OPENROUTER_URL, {
			method: 'POST',
			headers,
			body: JSON.stringify(body),
			signal: controller.signal,
		})
		const latencyMs = Date.now() - t0
		if (!res.ok) {
			const errText = await res.text().catch(() => '')
			if (shouldDebug) console.error('[openrouter] debug error', { status: res.status, latency_ms: latencyMs, error: errText?.slice?.(0, 500) })
			throw new Error(`OpenRouter ${res.status}: ${errText}`)
		}
		const json = await res.json()
		if (shouldDebug) {
			console.info('[openrouter] debug response', {
				latency_ms: latencyMs,
				usage: json?.usage || null,
				finish_reason: json?.choices?.[0]?.finish_reason || null,
			})
		}
		const content = json?.choices?.[0]?.message?.content
		return { content, raw: json }
	} finally {
		clearTimeout(timeout)
	}
}
