import { useState, useEffect, useCallback } from 'react'

export interface SubjectSession {
	id: string
	title: string
	type: string
	status: 'active' | 'completed'
	started_at: string
	ended_at?: string
	created_at: string
	updated_at: string
	duration?: number
}

export interface SubjectSessionsResponse {
	sessions: SubjectSession[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}

export interface SubjectSessionFilters {
	dateFrom?: string
	dateTo?: string
}

export function useSubjectSessions(
	subjectId: string,
	filters: SubjectSessionFilters = {},
	page: number = 1,
	pageSize: number = 10
) {
	const [data, setData] = useState<SubjectSessionsResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchSessions = useCallback(async () => {
		if (!subjectId) return

		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams({
				page: page.toString(),
				pageSize: pageSize.toString()
			})

			if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
			if (filters.dateTo) params.append('dateTo', filters.dateTo)

			const response = await fetch(`/api/subjects/${subjectId}/sessions?${params}`)
			
			if (!response.ok) {
				if (response.status === 403) {
					throw new Error('Access denied to subject sessions')
				}
				throw new Error(`Failed to fetch sessions: ${response.statusText}`)
			}

			const result = await response.json()
			setData(result)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch sessions')
		} finally {
			setLoading(false)
		}
	}, [subjectId, filters, page, pageSize])

	useEffect(() => {
		fetchSessions()
	}, [fetchSessions])

	return {
		sessions: data?.sessions || [],
		total: data?.total || 0,
		page: data?.page || 1,
		pageSize: data?.pageSize || pageSize,
		totalPages: data?.totalPages || 0,
		loading,
		error,
		refetch: fetchSessions
	}
}
