import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useCallback } from 'react'

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

// --- API Helpers ---

export async function fetchSessionsApi(
	filters: SessionFilters,
	page: number,
	pageSize: number,
	sort: string,
	direction: 'asc' | 'desc',
	signal?: AbortSignal
): Promise<SessionsResponse> {
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

	const response = await fetch(`/api/sessions?${params}`, { signal })
	if (!response.ok) throw new Error(`Failed to fetch sessions: ${response.statusText}`)
	return response.json()
}

async function createSessionApi(sessionData: Partial<Session>): Promise<Session> {
	const response = await fetch('/api/sessions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(sessionData)
	})
	if (!response.ok) throw new Error(`Failed to create session: ${response.statusText}`)
	return response.json()
}

export async function fetchSessionStatsApi(signal?: AbortSignal): Promise<SessionStats> {
	const response = await fetch('/api/sessions/stats', { signal })
	if (!response.ok) throw new Error(`Failed to fetch session stats: ${response.statusText}`)
	return response.json()
}

export async function fetchSessionApi(id: string, signal?: AbortSignal): Promise<Session> {
	const response = await fetch(`/api/sessions/${id}`, { signal })
	if (!response.ok) {
		if (response.status === 404) throw new Error('Session not found')
		throw new Error(`Failed to fetch session: ${response.statusText}`)
	}
	return response.json()
}

async function updateSessionApi({ id, updates }: { id: string; updates: Partial<Session> }): Promise<Session> {
	const response = await fetch(`/api/sessions/${id}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updates)
	})
	if (!response.ok) throw new Error(`Failed to update session: ${response.statusText}`)
	return response.json()
}

async function deleteSessionApi(id: string): Promise<boolean> {
	const response = await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
	if (!response.ok) throw new Error(`Failed to delete session: ${response.statusText}`)
	return true
}

// --- Hooks ---

export function useSessions(
	filters: SessionFilters = {},
	page: number = 1,
	pageSize: number = 10,
	sort: string = 'created_at',
	direction: 'asc' | 'desc' = 'desc'
) {
	const queryClient = useQueryClient()

	const { data, isLoading, isError, error, refetch } = useQuery({
		queryKey: ['sessions', { filters, page, pageSize, sort, direction }],
		queryFn: ({ signal }) =>
			fetchSessionsApi(
				filters,
				page,
				pageSize,
				sort,
				direction,
				signal as AbortSignal | undefined
			),
		placeholderData: keepPreviousData,
	})

	const createMutation = useMutation({
		mutationFn: createSessionApi,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessions'] })
			queryClient.invalidateQueries({ queryKey: ['session-stats'] })
		}
	})

	return {
		sessions: data?.sessions || [],
		total: data?.total || 0,
		page: data?.page || 1,
		pageSize: data?.pageSize || pageSize,
		totalPages: data?.totalPages || 0,
		loading: isLoading,
		error: isError ? (error as Error).message : null,
		refetch,
		createSession: createMutation.mutateAsync,
		isCreating: createMutation.isPending
	}
}

export function useSessionStats() {
	const { data, isLoading, isError, error, refetch } = useQuery({
		queryKey: ['session-stats'],
		queryFn: ({ signal }) => fetchSessionStatsApi(signal as AbortSignal | undefined)
	})

	return {
		stats: data,
		loading: isLoading,
		error: isError ? (error as Error).message : null,
		refetch
	}
}

export function useSession(id: string) {
	const queryClient = useQueryClient()

	const { data, isLoading, isError, error, refetch } = useQuery({
		queryKey: ['session', id],
		queryFn: ({ signal }) => fetchSessionApi(id, signal as AbortSignal | undefined),
		enabled: !!id
	})

	const updateMutation = useMutation({
		mutationFn: updateSessionApi,
		onSuccess: (updatedSession) => {
			queryClient.setQueryData(['session', id], updatedSession)
			queryClient.invalidateQueries({ queryKey: ['sessions'] })
		}
	})

	const deleteMutation = useMutation({
		mutationFn: deleteSessionApi,
		onSuccess: () => {
			queryClient.removeQueries({ queryKey: ['session', id] })
			queryClient.invalidateQueries({ queryKey: ['sessions'] })
			queryClient.invalidateQueries({ queryKey: ['session-stats'] })
		}
	})

	return {
		session: data,
		loading: isLoading,
		error: isError ? (error as Error).message : null,
		refetch,
		updateSession: (updates: Partial<Session>) => updateMutation.mutateAsync({ id, updates }),
		deleteSession: () => deleteMutation.mutateAsync(id),
		isUpdating: updateMutation.isPending,
		isDeleting: deleteMutation.isPending
	}
}
