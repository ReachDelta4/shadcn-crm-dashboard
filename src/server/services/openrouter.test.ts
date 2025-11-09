import { describe, it, expect, beforeEach, vi } from 'vitest'
import { normalizeProviderSort, chatWithTools, chatText, type ChatMessage, type ToolDefinition } from './openrouter'

describe('openrouter provider sort normalization', () => {
  it('maps legacy values to supported options', () => {
    expect(normalizeProviderSort(undefined)).toBe('price')
    expect(normalizeProviderSort('price')).toBe('price')
    expect(normalizeProviderSort('throughput')).toBe('throughput')
    expect(normalizeProviderSort('latency')).toBe('latency')
    expect(normalizeProviderSort('quality')).toBe('latency')
    expect(normalizeProviderSort('speed')).toBe('latency')
  })
})

describe('openrouter request bodies', () => {
  const model = 'test-model'
  const messages: ChatMessage[] = [
    { role: 'system', content: 'sys' },
    { role: 'user', content: 'hi' },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('chatText uses normalized provider.sort', async () => {
    const fetchSpy = vi.spyOn(global as any, 'fetch').mockImplementation(async (_url: any, init: any) => {
      const body = JSON.parse(init?.body || '{}')
      expect(body?.provider?.sort).toBe('latency')
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok' } }] }),
      } as any
    })
    await chatText({ model, messages, providerSort: 'quality' as any })
    expect(fetchSpy).toHaveBeenCalled()
  })

  it('chatWithTools uses normalized provider.sort', async () => {
    const tools: ToolDefinition[] = [
      { type: 'function', function: { name: 'noop', description: 'noop' } },
    ]
    const fetchSpy = vi.spyOn(global as any, 'fetch').mockImplementation(async (_url: any, init: any) => {
      const body = JSON.parse(init?.body || '{}')
      expect(body?.provider?.sort).toBe('latency')
      // Return a basic assistant message with no tool calls to finish loop
      return {
        ok: true,
        json: async () => ({ choices: [{ message: { role: 'assistant', content: 'ok', tool_calls: [] }, finish_reason: 'stop' }] }),
      } as any
    })
    await chatWithTools({
      model,
      messages,
      tools,
      handlers: { },
      providerSort: 'quality' as any,
      maxToolIterations: 1,
    })
    expect(fetchSpy).toHaveBeenCalled()
  })
})
