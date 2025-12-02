import { describe, it, expect, vi } from 'vitest'
import { invokeSummaryGeneration } from '../src/app/api/sessions/[id]/summary/helpers'

describe('invokeSummaryGeneration', () => {
  it('runs the generator with provided client and ids', async () => {
    const generator = vi.fn().mockResolvedValue({ markdown: '# ok' })
    const supabase = {} as any

    const result = await invokeSummaryGeneration(supabase, 'user-1', 'session-1', { generator })

    expect(generator).toHaveBeenCalledTimes(1)
    expect(generator).toHaveBeenCalledWith(supabase, 'user-1', 'session-1')
    expect(result.ok).toBe(true)
  })

  it('captures failures and returns ok=false', async () => {
    const generator = vi.fn().mockRejectedValue(new Error('boom'))
    const supabase = {} as any

    const result = await invokeSummaryGeneration(supabase, 'user-1', 'session-1', { generator })

    expect(generator).toHaveBeenCalledTimes(1)
    expect(result.ok).toBe(false)
    expect(result.error).toContain('boom')
  })
})
