import { describe, it, expect, vi, beforeEach } from 'vitest'

// These are integration-style tests for logic helpers; full E2E would run against a test DB.

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = new Date(aStart).getTime(); const ae = new Date(aEnd).getTime()
  const bs = new Date(bStart).getTime(); const be = new Date(bEnd).getTime()
  return !(ae <= bs || as >= be)
}

describe('appointments: overlap', () => {
  it('detects overlapping windows', () => {
    expect(overlaps('2025-10-05T10:00:00Z','2025-10-05T11:00:00Z','2025-10-05T10:30:00Z','2025-10-05T11:30:00Z')).toBe(true)
  })
  it('allows back-to-back', () => {
    expect(overlaps('2025-10-05T10:00:00Z','2025-10-05T11:00:00Z','2025-10-05T11:00:00Z','2025-10-05T12:00:00Z')).toBe(false)
  })
})

describe('appointments: outcome finalization logic sketch', () => {
  it('classifies taken when session overlaps buffered window', () => {
    const apptStart = '2025-10-05T10:00:00Z'
    const apptEnd = '2025-10-05T10:30:00Z'
    const bufferStart = new Date(new Date(apptStart).getTime() - 15*60*1000).toISOString()
    const bufferEnd = new Date(new Date(apptEnd).getTime() + 120*60*1000).toISOString()
    const sessionStart = '2025-10-05T10:10:00Z'
    expect(overlaps(bufferStart, bufferEnd, sessionStart, sessionStart)).toBe(true)
  })
})


