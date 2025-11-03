import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/server/auth/getUserAndScope', () => ({ getUserAndScope: vi.fn().mockResolvedValue({ userId: 'u1', allowedOwnerIds: ['u1'] }) }))

vi.mock('@/server/repositories/leads', () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({ getById: vi.fn().mockResolvedValue({ id: 'lead_1', full_name: 'Jane', company: 'Acme' }) })),
}))

vi.mock('@/server/repositories/lead-appointments', () => ({
  LeadAppointmentsRepository: vi.fn().mockImplementation(() => ({
    findByLeadId: vi.fn().mockResolvedValue([
      { id: 'appt_1', start_at_utc: new Date().toISOString(), end_at_utc: new Date(Date.now()+3600000).toISOString(), timezone: 'UTC', meeting_link: 'https://meet.example.com/x' },
    ]),
  })),
}))

vi.mock('@/server/utils/ics-generator', () => ({
  generateICS: vi.fn().mockReturnValue('BEGIN:VCALENDAR\nEND:VCALENDAR'),
  generateICSDownloadFilename: vi.fn().mockReturnValue('meeting.ics'),
}))

import { GET } from '@/app/api/leads/[id]/appointments/[appointmentId]/ics/route'

describe('GET /api/leads/[id]/appointments/[appointmentId]/ics', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ICS file when appointment exists', async () => {
    const res = await GET(new Request('http://localhost/api/leads/lead_1/appointments/appt_1/ics') as any, { params: Promise.resolve({ id: 'lead_1', appointmentId: 'appt_1' }) } as any)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/text\/calendar/)
    expect(res.headers.get('Content-Disposition')).toContain('attachment')
    const text = await res.text()
    expect(text).toContain('BEGIN:VCALENDAR')
  })

  it('returns 404 when appointment missing', async () => {
    const { LeadAppointmentsRepository } = await import('@/server/repositories/lead-appointments')
    ;(LeadAppointmentsRepository as any).mockImplementation(() => ({ findByLeadId: vi.fn().mockResolvedValue([]) }))
    const res = await GET(new Request('http://localhost/api/leads/lead_1/appointments/appt_x/ics') as any, { params: Promise.resolve({ id: 'lead_1', appointmentId: 'appt_x' }) } as any)
    expect(res.status).toBe(404)
  })
})


