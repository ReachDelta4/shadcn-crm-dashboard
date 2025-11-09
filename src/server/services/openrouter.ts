export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ToolCall {
	id: string
	type: 'function'
	function: {
		name: string
		arguments: string
	}
}

export interface ChatMessage {
	role: ChatRole
	content?: string
	name?: string
	tool_call_id?: string
	tool_calls?: ToolCall[]
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
	providerSort?: 'price' | 'throughput' | 'latency'
	timeoutMs?: number
	debug?: boolean
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

// Normalize provider sort to current OpenRouter API values.
// Backwards compatible mapping for legacy values used in older code.
export function normalizeProviderSort(sort: string | undefined): 'price' | 'throughput' | 'latency' {
	const envDefault = (process.env.OPENROUTER_PROVIDER_SORT || '').toLowerCase()
	const candidate = (sort || envDefault || 'price').toLowerCase()
	if (candidate === 'price') return 'price'
	if (candidate === 'throughput') return 'throughput'
	if (candidate === 'latency') return 'latency'
	// legacy aliases
	if (candidate === 'speed') return 'latency'
	if (candidate === 'quality') return 'latency'
	return 'price'
}

function buildHeaders(): Record<string, string> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
	}
	if (process.env.OPENROUTER_HTTP_REFERER) headers['HTTP-Referer'] = process.env.OPENROUTER_HTTP_REFERER
	if (process.env.OPENROUTER_X_TITLE) headers['X-Title'] = process.env.OPENROUTER_X_TITLE
	return headers
}

function messageCharLength(message: ChatMessage): number {
	const content = message.content
	if (typeof content === 'string') return content.length
	return 0
}

function estimateTokens(messages: ChatMessage[]): { approxTokens: number; charCount: number } {
	const charCount = messages.reduce((sum, m) => sum + messageCharLength(m), 0)
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
		provider: { sort: normalizeProviderSort(opts.providerSort) },
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

// Text (markdown) chat without JSON schema enforcement
export interface ChatTextOptions {
  model: string
  messages: ChatMessage[]
  temperature?: number
  maxTokens?: number
  providerSort?: 'price' | 'throughput' | 'latency'
  timeoutMs?: number
  debug?: boolean
}

export async function chatText(opts: ChatTextOptions): Promise<{ content: string; raw: any }> {
  const body: any = {
    model: opts.model,
    messages: opts.messages,
    provider: { sort: normalizeProviderSort(opts.providerSort) },
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
    max_tokens: typeof opts.maxTokens === 'number' ? opts.maxTokens : 4000,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 90_000)
  const shouldDebug = Boolean(opts.debug || process.env.OPENROUTER_DEBUG === 'true' || process.env.REPORT_DEBUG_OPENROUTER === 'true')

  const headers = buildHeaders()
  const { approxTokens, charCount } = ((): { approxTokens: number; charCount: number } => {
    const charCount = (opts.messages || []).reduce((s, m) => s + (m.content?.length || 0), 0)
    return { approxTokens: Math.ceil(charCount / 4), charCount }
  })()
  const requestSizeBytes = (() => {
    try {
      if (typeof Buffer !== 'undefined') return Buffer.byteLength(JSON.stringify(body), 'utf8')
    } catch {}
    try { return new TextEncoder().encode(JSON.stringify(body)).length } catch {}
    try { return (JSON.stringify(body) || '').length } catch { return 0 }
  })()
  const t0 = Date.now()
  try {
    if (shouldDebug) {
      console.info('[openrouter:text] debug request', {
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
      if (shouldDebug) console.error('[openrouter:text] debug error', { status: res.status, latency_ms: latencyMs, error: errText?.slice?.(0, 500) })
      throw new Error(`OpenRouter ${res.status}: ${errText}`)
    }
    const json = await res.json()
    if (shouldDebug) {
      console.info('[openrouter:text] debug response', {
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

export type ToolDefinition = {
	type: 'function'
	function: {
		name: string
		description?: string
		parameters?: Record<string, any>
	}
}

export interface ChatToolHandlerResult {
	content: string
	metadata?: Record<string, any>
}

export type ChatToolHandler = (args: any, context: { toolCall: ToolCall }) => Promise<ChatToolHandlerResult> | ChatToolHandlerResult

export interface ChatWithToolsOptions {
	model: string
	messages: ChatMessage[]
	tools: ToolDefinition[]
	handlers: Record<string, ChatToolHandler>
	toolChoice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
	parallelToolCalls?: boolean
	maxToolIterations?: number
	providerSort?: 'price' | 'throughput' | 'latency'
	temperature?: number
	maxTokens?: number
	timeoutMs?: number
	debug?: boolean
	returnOnToolCall?: boolean
}

export interface ChatToolCallLog {
	tool: string
	arguments: any
	response: ChatToolHandlerResult
	toolCallId: string
}

export interface ChatWithToolsResult {
	finalMessage?: ChatMessage
	raw: any
	toolCalls: ChatToolCallLog[]
	transcript: ChatMessage[]
}

export async function chatWithTools(opts: ChatWithToolsOptions): Promise<ChatWithToolsResult> {
	const conversation: ChatMessage[] = [...opts.messages]
	const toolCalls: ChatToolCallLog[] = []
	const maxIterations = Math.max(1, opts.maxToolIterations ?? 3)
	const shouldDebug = Boolean(opts.debug || process.env.OPENROUTER_DEBUG === 'true' || process.env.REPORT_DEBUG_OPENROUTER === 'true')

	for (let iteration = 0; iteration < maxIterations; iteration++) {
		const body: any = {
			model: opts.model,
			messages: conversation,
			tools: opts.tools,
			provider: { sort: normalizeProviderSort(opts.providerSort) },
			tool_choice: opts.toolChoice ?? 'auto',
			parallel_tool_calls: typeof opts.parallelToolCalls === 'boolean' ? opts.parallelToolCalls : undefined,
			temperature: typeof opts.temperature === 'number' ? opts.temperature : 0,
			max_tokens: typeof opts.maxTokens === 'number' ? opts.maxTokens : undefined,
		}

		const controller = new AbortController()
		const timeout = setTimeout(() => controller.abort(), typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 120_000)
		const headers = buildHeaders()
		const { approxTokens, charCount } = estimateTokens(conversation)
  const requestSizeBytes = (() => {
    try {
      if (typeof Buffer !== 'undefined') return Buffer.byteLength(JSON.stringify(body), 'utf8')
    } catch {}
    try { return new TextEncoder().encode(JSON.stringify(body)).length } catch {}
    try { return (JSON.stringify(body) || '').length } catch { return 0 }
  })()
		const t0 = Date.now()
		try {
			if (shouldDebug) {
				console.info('[openrouter:tools] debug request', {
					iteration,
					model: opts.model,
					input_tokens_approx: approxTokens,
					input_chars: charCount,
					request_size_bytes: requestSizeBytes,
					provider_sort: body.provider?.sort,
					tool_choice: body.tool_choice,
					parallel_tool_calls: body.parallel_tool_calls,
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
				if (shouldDebug) console.error('[openrouter:tools] debug error', { status: res.status, latency_ms: latencyMs, error: errText?.slice?.(0, 500) })
				throw new Error(`OpenRouter ${res.status}: ${errText}`)
			}
			const json = await res.json()
			const choice = json?.choices?.[0]
			if (!choice?.message) throw new Error('OpenRouter response missing message for tool call flow')
			if (shouldDebug) {
				console.info('[openrouter:tools] debug response', {
					iteration,
					latency_ms: latencyMs,
					finish_reason: choice?.finish_reason || null,
					tool_calls: choice?.message?.tool_calls?.map((t: ToolCall) => t?.function?.name) || [],
				})
			}
			const assistantMessage = choice.message as ChatMessage
			conversation.push(assistantMessage)
			const calls = assistantMessage.tool_calls || []
			if (calls.length > 0) {
				for (const call of calls) {
					const handler = opts.handlers?.[call.function?.name]
					if (!handler) throw new Error(`Unhandled tool call: ${call.function?.name}`)
					let parsedArgs: any = {}
					try {
						parsedArgs = call.function?.arguments ? JSON.parse(call.function.arguments) : {}
					} catch (error) {
						throw new Error(`Failed to parse tool arguments for ${call.function?.name}: ${(error as Error).message}`)
					}
					const handlerResult = await handler(parsedArgs, { toolCall: call })
					const content = typeof handlerResult.content === 'string' ? handlerResult.content : JSON.stringify(handlerResult.content ?? {})
					conversation.push({
						role: 'tool',
						tool_call_id: call.id,
						content,
					})
					toolCalls.push({
						tool: call.function.name,
						arguments: parsedArgs,
						response: handlerResult,
						toolCallId: call.id,
					})
				}
				if (opts.returnOnToolCall) {
					return { finalMessage: assistantMessage, raw: json, toolCalls, transcript: conversation }
				}
				continue
			}
			return { finalMessage: assistantMessage, raw: json, toolCalls, transcript: conversation }
		} finally {
			clearTimeout(timeout)
		}
	}
	throw new Error('Tool calling loop exceeded maximum iterations without completion')
}
