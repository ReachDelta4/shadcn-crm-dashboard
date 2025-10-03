import { useState, useEffect, useCallback } from 'react'

export interface SessionFilters {
	search?: string
	status?: 'all' | 'active' | 'completed' | 'cancelled'
	dateFrom?: string
	dateTo?: string
	type?: string
}

export interface Session {
	id: string
	owner_id: string
	subject_id: string | null
	title: string
	description?: string
	status: 'active' | 'completed' | 'cancelled'
	type: string
	started_at: string
	ended_at?: string
	created_at: string
	updated_at: string
	metadata?: any
}

export interface SessionsResponse {
	sessions: Session[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}

export interface SessionStats {
	total: number
	active: number
	completed: number
	cancelled: number
}

export function useSessions(
	filters: SessionFilters = {},
	page: number = 1,
	pageSize: number = 10,
	sort: string = 'created_at',
	direction: 'asc' | 'desc' = 'desc'
) {
	const [data, setData] = useState<SessionsResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchSessions = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString(),
				sort,
				direction
			})

			if (filters.search) params.append('search', filters.search)
			if (filters.status && filters.status !== 'all') params.append('status', filters.status)
			if (filters.type) params.append('type', filters.type)
			if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
			if (filters.dateTo) params.append('dateTo', filters.dateTo)

			const response = await fetch(`/api/sessions?${params}`)
			
			if (!response.ok) {
				throw new Error(`Failed to fetch sessions: ${response.statusText}`)
			}

			const result = await response.json()
			setData(result)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
		} finally {
			setLoading(false)
		}
	}, [filters, page, pageSize, sort, direction])

	useEffect(() => {
		fetchSessions()
	}, [fetchSessions])

	const createSession = async (sessionData: Partial<Session>) => {
		try {
			const response = await fetch('/api/sessions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(sessionData)
			})

			if (!response.ok) {
				throw new Error(`Failed to create session: ${response.statusText}`)
			}

			const newSession = await response.json()
			
			// Refresh the list
			await fetchSessions()
			
			return newSession
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Failed to create session')
		}
	}

	return {
		sessions: data?.sessions || [],
		total: data?.total || 0,
		page: data?.page || 1,
		pageSize: data?.pageSize || pageSize,
		totalPages: data?.totalPages || 0,
		loading,
		error,
		refetch: fetchSessions,
		createSession
	}
}

export function useSessionStats() {
	const [stats, setStats] = useState<SessionStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchStats = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch('/api/sessions/stats')
			
			if (!response.ok) {
				throw new Error(`Failed to fetch session stats: ${response.statusText}`)
			}

			const result = await response.json()
			setStats(result)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch session stats')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchStats()
	}, [fetchStats])

	return {
		stats,
		loading,
		error,
		refetch: fetchStats
	}
}

export function useSession(id: string) {
	const [session, setSession] = useState<Session | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchSession = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(`/api/sessions/${id}`)
			
			if (!response.ok) {
				if (response.status === 404) {
					throw new Error('Session not found')
				}
				throw new Error(`Failed to fetch session: ${response.statusText}`)
			}

			const result = await response.json()
			setSession(result)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch session')
		} finally {
			setLoading(false)
		}
	}, [id])

	const updateSession = async (updates: Partial<Session>) => {
		try {
			const response = await fetch(`/api/sessions/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updates)
			})

			if (!response.ok) {
				throw new Error(`Failed to update session: ${response.statusText}`)
			}

			const updatedSession = await response.json()
			setSession(updatedSession)
			
			return updatedSession
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Failed to update session')
		}
	}

	const deleteSession = async () => {
		try {
			const response = await fetch(`/api/sessions/${id}`, {
				method: 'DELETE'
			})

			if (!response.ok) {
				throw new Error(`Failed to delete session: ${response.statusText}`)
			}

			return true
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Failed to delete session')
		}
	}

	useEffect(() => {
		if (id) {
			fetchSession()
		}
	}, [id, fetchSession])

	return {
		session,
		loading,
		error,
		refetch: fetchSession,
		updateSession,
		deleteSession
	}
}
