import { describe, it, expect, vi, beforeEach } from 'vitest'
import { logLeadTransition, logLeadError } from '@/server/services/logging/lead-logger'

describe('lead-logger', () => {
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logs structured transition events without throwing', () => {
    logLeadTransition({
      operation: 'single_transition',
      leadId: 'lead-1',
      userId: 'user-1',
      targetStatus: 'qualified',
      currentStatus: 'contacted',
      source: 'test',
    })

    expect(infoSpy).toHaveBeenCalledTimes(1)
    const [prefix, payload] = infoSpy.mock.calls[0]
    expect(prefix).toBe('[lead]')
    expect(typeof payload).toBe('string')
    const parsed = JSON.parse(payload)
    expect(parsed.type).toBe('lead_transition')
    expect(parsed.leadId).toBe('lead-1')
    expect(parsed.targetStatus).toBe('qualified')
  })

  it('logs structured error events without leaking full Error objects', () => {
    const err = new Error('boom')
    logLeadError({
      operation: 'single_transition',
      leadId: 'lead-2',
      userId: 'user-2',
      targetStatus: 'converted',
      currentStatus: 'qualified',
      source: 'test',
      code: 'test_error',
      error: err,
    })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    const [prefix, payload] = errorSpy.mock.calls[0]
    expect(prefix).toBe('[lead]')
    const parsed = JSON.parse(payload)
    expect(parsed.type).toBe('lead_error')
    expect(parsed.code).toBe('test_error')
    expect(parsed.error).toEqual({ message: 'boom', name: 'Error' })
  })
})

