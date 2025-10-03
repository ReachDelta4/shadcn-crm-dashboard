import { describe, it, expect } from 'vitest'
// Unit tests for event normalizer
// To run: npm install --save-dev jest @jest/globals @types/jest ts-jest
// See TESTING_SETUP.md for configuration

import { normalizeAppointment, normalizeAppointments, type LeadAppointment } from '../lib/normalize'

// Test framework imports (install jest to enable)
// Using vitest for type-safe test globals

describe('Event Normalizer', () => {
  describe('normalizeAppointment', () => {
    it('should normalize a valid appointment', () => {
      const appointment: LeadAppointment = {
        id: '123',
        lead_id: 'lead-456',
        subject_id: 'subject-789',
        provider: 'google_meet',
        status: 'scheduled',
        start_at_utc: '2025-10-15T14:00:00Z',
        end_at_utc: '2025-10-15T15:00:00Z',
        timezone: 'America/New_York',
        meeting_link: 'https://meet.google.com/abc',
      }

      const result = normalizeAppointment(appointment)

      expect(result).toBeTruthy()
      expect(result?.id).toBe('123')
      expect(result?.source_type).toBe('appointment')
      expect(result?.title).toBe('Appointment (google_meet)')
      expect(result?.start_at_utc).toBe('2025-10-15T14:00:00Z')
      expect(result?.end_at_utc).toBe('2025-10-15T15:00:00Z')
      expect(result?.timezone).toBe('America/New_York')
      expect(result?.links.lead_id).toBe('lead-456')
      expect(result?.links.meeting_link).toBe('https://meet.google.com/abc')
    })

    it('should return null for appointment with missing id', () => {
      const appointment: any = {
        lead_id: 'lead-456',
        start_at_utc: '2025-10-15T14:00:00Z',
        end_at_utc: '2025-10-15T15:00:00Z',
        // id missing
      }

      const result = normalizeAppointment(appointment)
      expect(result).toBeNull()
    })

    it('should return null for appointment with missing start_at_utc', () => {
      const appointment: any = {
        id: '123',
        lead_id: 'lead-456',
        end_at_utc: '2025-10-15T15:00:00Z',
        // start_at_utc missing
      }

      const result = normalizeAppointment(appointment)
      expect(result).toBeNull()
    })

    it('should return null for appointment with missing end_at_utc', () => {
      const appointment: any = {
        id: '123',
        lead_id: 'lead-456',
        start_at_utc: '2025-10-15T14:00:00Z',
        // end_at_utc missing
      }

      const result = normalizeAppointment(appointment)
      expect(result).toBeNull()
    })

    it('should return null for appointment with invalid start date', () => {
      const appointment: LeadAppointment = {
        id: '123',
        lead_id: 'lead-456',
        subject_id: null,
        provider: 'none',
        status: 'scheduled',
        start_at_utc: 'invalid-date',
        end_at_utc: '2025-10-15T15:00:00Z',
        timezone: 'UTC',
        meeting_link: null,
      }

      const result = normalizeAppointment(appointment)
      expect(result).toBeNull()
    })

    it('should return null for appointment with invalid end date', () => {
      const appointment: LeadAppointment = {
        id: '123',
        lead_id: 'lead-456',
        subject_id: null,
        provider: 'none',
        status: 'scheduled',
        start_at_utc: '2025-10-15T14:00:00Z',
        end_at_utc: 'not-a-date',
        timezone: 'UTC',
        meeting_link: null,
      }

      const result = normalizeAppointment(appointment)
      expect(result).toBeNull()
    })

    it('should clamp inverted date range (start after end)', () => {
      const appointment: LeadAppointment = {
        id: '123',
        lead_id: 'lead-456',
        subject_id: null,
        provider: 'none',
        status: 'scheduled',
        start_at_utc: '2025-10-15T16:00:00Z', // After end
        end_at_utc: '2025-10-15T15:00:00Z',
        timezone: 'UTC',
        meeting_link: null,
      }

      const result = normalizeAppointment(appointment)

      expect(result).toBeTruthy()
      expect(result?.start_at_utc).toBe('2025-10-15T16:00:00Z')
      expect(result?.end_at_utc).toBe('2025-10-15T16:00:00Z') // Clamped to start
    })

    it('should default timezone to UTC if missing', () => {
      const appointment: LeadAppointment = {
        id: '123',
        lead_id: 'lead-456',
        subject_id: null,
        provider: 'none',
        status: 'scheduled',
        start_at_utc: '2025-10-15T14:00:00Z',
        end_at_utc: '2025-10-15T15:00:00Z',
        timezone: '', // Empty timezone
        meeting_link: null,
      }

      const result = normalizeAppointment(appointment)

      expect(result).toBeTruthy()
      expect(result?.timezone).toBe('UTC')
    })

    it('should not include provider in title when provider is "none"', () => {
      const appointment: LeadAppointment = {
        id: '123',
        lead_id: 'lead-456',
        subject_id: null,
        provider: 'none',
        status: 'scheduled',
        start_at_utc: '2025-10-15T14:00:00Z',
        end_at_utc: '2025-10-15T15:00:00Z',
        timezone: 'UTC',
        meeting_link: null,
      }

      const result = normalizeAppointment(appointment)

      expect(result?.title).toBe('Appointment')
    })
  })

  describe('normalizeAppointments', () => {
    it('should normalize an array of valid appointments', () => {
      const appointments: LeadAppointment[] = [
        {
          id: '1',
          lead_id: 'lead-1',
          subject_id: null,
          provider: 'zoom',
          status: 'scheduled',
          start_at_utc: '2025-10-15T14:00:00Z',
          end_at_utc: '2025-10-15T15:00:00Z',
          timezone: 'UTC',
          meeting_link: 'https://zoom.us/j/123',
        },
        {
          id: '2',
          lead_id: 'lead-2',
          subject_id: null,
          provider: 'google_meet',
          status: 'scheduled',
          start_at_utc: '2025-10-16T10:00:00Z',
          end_at_utc: '2025-10-16T11:00:00Z',
          timezone: 'UTC',
          meeting_link: 'https://meet.google.com/xyz',
        },
      ]

      const results = normalizeAppointments(appointments)

      expect(results).toHaveLength(2)
      expect(results[0].id).toBe('1')
      expect(results[1].id).toBe('2')
    })

    it('should filter out invalid appointments', () => {
      const appointments: any[] = [
        {
          id: '1',
          lead_id: 'lead-1',
          start_at_utc: '2025-10-15T14:00:00Z',
          end_at_utc: '2025-10-15T15:00:00Z',
        },
        {
          // Missing id
          lead_id: 'lead-2',
          start_at_utc: '2025-10-16T10:00:00Z',
          end_at_utc: '2025-10-16T11:00:00Z',
        },
        {
          id: '3',
          lead_id: 'lead-3',
          start_at_utc: 'invalid-date',
          end_at_utc: '2025-10-17T12:00:00Z',
        },
      ]

      const results = normalizeAppointments(appointments)

      expect(results).toHaveLength(1) // Only first one is valid
      expect(results[0].id).toBe('1')
    })

    it('should return empty array for non-array input', () => {
      const results = normalizeAppointments(null as any)
      expect(results).toEqual([])
    })

    it('should handle empty array', () => {
      const results = normalizeAppointments([])
      expect(results).toEqual([])
    })

    it('should preserve order of valid appointments', () => {
      const appointments: LeadAppointment[] = [
        {
          id: 'first',
          lead_id: 'lead-1',
          subject_id: null,
          provider: 'none',
          status: 'scheduled',
          start_at_utc: '2025-10-15T14:00:00Z',
          end_at_utc: '2025-10-15T15:00:00Z',
          timezone: 'UTC',
          meeting_link: null,
        },
        {
          id: 'second',
          lead_id: 'lead-2',
          subject_id: null,
          provider: 'none',
          status: 'scheduled',
          start_at_utc: '2025-10-16T10:00:00Z',
          end_at_utc: '2025-10-16T11:00:00Z',
          timezone: 'UTC',
          meeting_link: null,
        },
      ]

      const results = normalizeAppointments(appointments)

      expect(results[0].id).toBe('first')
      expect(results[1].id).toBe('second')
    })
  })
})
