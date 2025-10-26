import { describe, it, expect } from 'vitest'
import { validateStatus, isTransitionAllowed } from '@/server/services/lifecycle/transition-matrix'
import {
  APPOINTMENT_TARGET_STATUS,
  MODE_TARGET_STATUS,
  shouldAdvanceToQualified,
  isForwardTransition,
} from '@/features/leads/status-utils'

describe('Lead status canonicalization', () => {
  it('accepts only canonical statuses', () => {
    expect(validateStatus('new')).toBe(true)
    expect(validateStatus('contacted')).toBe(true)
    expect(validateStatus('qualified')).toBe(true)
    expect(validateStatus('disqualified')).toBe(true)
    expect(validateStatus('converted')).toBe(true)

    // Legacy/ghost statuses should not validate
    expect(validateStatus('won' as any)).toBe(false)
    expect(validateStatus('lost' as any)).toBe(false)
    expect(validateStatus('unqualified' as any)).toBe(false)
    expect(validateStatus('demo_appointment' as any)).toBe(false)
    expect(validateStatus('proposal_negotiation' as any)).toBe(false)
    expect(validateStatus('invoice_sent' as any)).toBe(false)
  })

  it('enforces forward-only transitions', () => {
    expect(isTransitionAllowed('contacted', 'qualified')).toBe(true)
    expect(isTransitionAllowed('qualified', 'contacted')).toBe(false)
    expect(isTransitionAllowed('new', 'new')).toBe(false)
  })

  it('uses shared helpers for appointment advancement and lifecycle mapping', () => {
    expect(APPOINTMENT_TARGET_STATUS).toBe('qualified')
    expect(MODE_TARGET_STATUS.invoice_sent).toBe('qualified')
    expect(MODE_TARGET_STATUS.won).toBe('converted')
    expect(shouldAdvanceToQualified(undefined)).toBe(true)
    expect(shouldAdvanceToQualified('new')).toBe(true)
    expect(shouldAdvanceToQualified('contacted')).toBe(true)
    expect(shouldAdvanceToQualified('qualified')).toBe(false)
    expect(shouldAdvanceToQualified('disqualified')).toBe(false)
    expect(isForwardTransition('new', 'qualified')).toBe(true)
    expect(isForwardTransition('qualified', 'contacted')).toBe(false)
  })
})
