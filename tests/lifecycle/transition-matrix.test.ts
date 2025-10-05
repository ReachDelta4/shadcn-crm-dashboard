import { describe, it, expect } from 'vitest'
import { isTransitionAllowed, validateStatus } from '@/server/services/lifecycle/transition-matrix'

describe('lifecycle: transition-matrix', () => {
  it('validates statuses', () => {
    expect(validateStatus('new')).toBe(true)
    expect(validateStatus('qualified')).toBe(true)
    expect(validateStatus('lost')).toBe(true)
    // @ts-expect-error
    expect(validateStatus('invalid')).toBe(false)
  })

  it('disallows self transition', () => {
    expect(isTransitionAllowed('new', 'new')).toBe(false)
  })

  it('allows forward transitions', () => {
    expect(isTransitionAllowed('new', 'contacted')).toBe(true)
    expect(isTransitionAllowed('contacted', 'qualified')).toBe(true)
    expect(isTransitionAllowed('qualified', 'demo_appointment')).toBe(true)
    expect(isTransitionAllowed('proposal_negotiation', 'invoice_sent')).toBe(true)
    expect(isTransitionAllowed('invoice_sent', 'won')).toBe(true)
    expect(isTransitionAllowed('invoice_sent', 'lost')).toBe(true)
  })

  it('prevents backwards movement', () => {
    expect(isTransitionAllowed('qualified', 'contacted')).toBe(false)
    expect(isTransitionAllowed('won', 'invoice_sent')).toBe(false)
  })
})


