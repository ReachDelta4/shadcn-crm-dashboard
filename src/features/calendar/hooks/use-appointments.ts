import { useState, useEffect } from 'react'
import { CalendarEvent, normalizeAppointments, type LeadAppointment } from '../lib/normalize'

interface UseAppointmentsOptions {
	from?: string
	to?: string
	limit?: number
	enabled?: boolean
}

interface UseAppointmentsResult {
	events: CalendarEvent[]
	loading: boolean
	error: string | null
	refetch: () => void
}

export function useAppointments(options: UseAppointmentsOptions = {}): UseAppointmentsResult {
	const { from, to, limit, enabled = true } = options
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [refetchTrigger, setRefetchTrigger] = useState(0)

	const refetch = () => setRefetchTrigger(prev => prev + 1)

	useEffect(() => {
		if (!enabled) return

		const fetchAppointments = async () => {
			setLoading(true)
			setError(null)

			try {
				const params = new URLSearchParams()
				if (from) params.set('from', from)
				if (to) params.set('to', to)
				if (limit) params.set('limit', String(limit))

				const response = await fetch(`/api/appointments?${params.toString()}`)
				
				if (!response.ok) {
					const errorData = await response.json().catch(() => ({ error: 'Failed to fetch appointments' }))
					throw new Error(errorData.error || 'Failed to fetch appointments')
				}

				const data = await response.json()
				const normalizedEvents = normalizeAppointments(data.appointments || [])
				setEvents(normalizedEvents)
			} catch (err) {
				console.error('[useAppointments] Error:', err)
				setError(err instanceof Error ? err.message : 'An error occurred')
				setEvents([])
			} finally {
				setLoading(false)
			}
		}

		fetchAppointments()
	}, [from, to, limit, enabled, refetchTrigger])

	return { events, loading, error, refetch }
}
