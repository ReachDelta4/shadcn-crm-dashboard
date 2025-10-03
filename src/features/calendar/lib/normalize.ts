import { parseISO, isValid } from 'date-fns'

export type CalendarEventSourceType = 'appointment' | 'payment_schedule' | 'recurring_revenue' | 'task'

export interface CalendarEvent {
	id: string
	source_type: CalendarEventSourceType
	title: string
	start_at_utc: string
	end_at_utc: string
	timezone: string
	links: {
		subject_id?: string | null
		lead_id?: string | null
		meeting_link?: string | null
	}
	meta: Record<string, any>
}

export interface LeadAppointment {
	id: string
	lead_id: string
	subject_id: string | null
	provider: string
	status: string
	start_at_utc: string
	end_at_utc: string
	timezone: string
	meeting_link: string | null
	notes?: any
}

/**
 * Normalize a lead appointment to a calendar event
 * Defensive: validates ISO dates, clamps inverted ranges, drops invalid entries
 */
export function normalizeAppointment(appointment: LeadAppointment): CalendarEvent | null {
	try {
		// Validate required fields
		if (!appointment.id || !appointment.start_at_utc || !appointment.end_at_utc) {
			console.warn('[normalizeAppointment] Missing required fields:', appointment.id)
			return null
		}

		// Validate and parse dates
		const startDate = parseISO(appointment.start_at_utc)
		const endDate = parseISO(appointment.end_at_utc)

		if (!isValid(startDate) || !isValid(endDate)) {
			console.warn('[normalizeAppointment] Invalid dates:', appointment.id)
			return null
		}

		// Clamp inverted ranges (start after end)
		const finalStart = appointment.start_at_utc
		let finalEnd = appointment.end_at_utc

		if (startDate > endDate) {
			console.warn('[normalizeAppointment] Inverted date range, clamping:', appointment.id)
			finalEnd = finalStart
		}

		// Build normalized event
		return {
			id: appointment.id,
			source_type: 'appointment',
			title: `Appointment${appointment.provider !== 'none' ? ` (${appointment.provider})` : ''}`,
			start_at_utc: finalStart,
			end_at_utc: finalEnd,
			timezone: appointment.timezone || 'UTC',
			links: {
				subject_id: appointment.subject_id,
				lead_id: appointment.lead_id,
				meeting_link: appointment.meeting_link,
			},
			meta: {
				provider: appointment.provider,
				status: appointment.status,
				notes: appointment.notes,
			},
		}
	} catch (error) {
		console.error('[normalizeAppointment] Error normalizing appointment:', appointment.id, error)
		return null
	}
}

/**
 * Normalize a batch of appointments, filtering out invalid entries
 */
export function normalizeAppointments(appointments: LeadAppointment[]): CalendarEvent[] {
	if (!Array.isArray(appointments)) {
		console.warn('[normalizeAppointments] Input is not an array')
		return []
	}

	return appointments
		.map(normalizeAppointment)
		.filter((event): event is CalendarEvent => event !== null)
}

/**
 * Future: Add normalizers for other event sources
 * - normalizePaymentSchedule
 * - normalizeRecurringRevenue
 * - normalizeTask
 */
