import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface TranscriptFilters {
	search?: string
	sessionId?: string
	dateFrom?: string
	dateTo?: string
	speaker?: string
}

export interface Transcript {
	id: string
	session_id: string
	owner_id: string
	content_enc: string
	speaker?: string
	timestamp: string
	confidence?: number
	created_at: string
	metadata?: any
}

export interface TranscriptsResponse {
	transcripts: Transcript[]
	total: number
	page: number
	pageSize: number
	totalPages: number
}

export function useTranscripts(
	filters: TranscriptFilters = {},
	page: number = 1,
	pageSize: number = 50,
	sort: string = 'timestamp',
	direction: 'asc' | 'desc' = 'asc'
) {
	const [data, setData] = useState<TranscriptsResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchTranscripts = async () => {
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
			if (filters.sessionId) params.append('sessionId', filters.sessionId)
			if (filters.speaker) params.append('speaker', filters.speaker)
			if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
			if (filters.dateTo) params.append('dateTo', filters.dateTo)

			const response = await fetch(`/api/transcripts?${params}`)
			
			if (!response.ok) {
				throw new Error(`Failed to fetch transcripts: ${response.statusText}`)
			}

			const result = await response.json()
			setData(result)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch transcripts')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTranscripts()
	}, [filters, page, pageSize, sort, direction])

	const createTranscript = async (transcriptData: Partial<Transcript>) => {
		try {
			const response = await fetch('/api/transcripts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(transcriptData)
			})

			if (!response.ok) {
				throw new Error(`Failed to create transcript: ${response.statusText}`)
			}

			const newTranscript = await response.json()
			
			// Refresh the list
			await fetchTranscripts()
			
			return newTranscript
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Failed to create transcript')
		}
	}

	return {
		transcripts: data?.transcripts || [],
		total: data?.total || 0,
		page: data?.page || 1,
		pageSize: data?.pageSize || pageSize,
		totalPages: data?.totalPages || 0,
		loading,
		error,
		refetch: fetchTranscripts,
		createTranscript
	}
}

export function useSessionTranscripts(sessionId: string, enableRealtime: boolean = false) {
	const [transcripts, setTranscripts] = useState<Transcript[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const subscriptionRef = useRef<any>(null)
	const supabase = createClient()

	const fetchSessionTranscripts = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(`/api/transcripts?sessionId=${sessionId}`)
			
			if (!response.ok) {
				throw new Error(`Failed to fetch session transcripts: ${response.statusText}`)
			}

			const result = await response.json()
			setTranscripts(result.transcripts || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch session transcripts')
		} finally {
			setLoading(false)
		}
	}, [sessionId])

	const subscribeToRealtime = useCallback(() => {
		if (!enableRealtime || !sessionId) return

		// Unsubscribe from previous subscription
		if (subscriptionRef.current) {
			subscriptionRef.current.unsubscribe()
		}

		subscriptionRef.current = supabase
			.channel(`transcripts:${sessionId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'transcripts',
					filter: `session_id=eq.${sessionId}`
				},
				(payload) => {
					if (payload.eventType === 'INSERT') {
						setTranscripts(prev => [...prev, payload.new as Transcript].sort(
							(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
						))
					} else if (payload.eventType === 'UPDATE') {
						setTranscripts(prev => prev.map(t => 
							t.id === (payload.new as any).id ? (payload.new as Transcript) : t
						))
					} else if (payload.eventType === 'DELETE') {
						setTranscripts(prev => prev.filter(t => t.id !== (payload.old as any).id))
					}
				}
			)
			.subscribe()
	}, [enableRealtime, sessionId, supabase])

	useEffect(() => {
		if (sessionId) {
			fetchSessionTranscripts()
			subscribeToRealtime()
		}

		return () => {
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe()
			}
		}
	}, [sessionId, enableRealtime, fetchSessionTranscripts, subscribeToRealtime])

	const addTranscriptSegment = async (content: string, speaker?: string, confidence?: number) => {
		try {
			const transcriptData = {
				session_id: sessionId,
				content_enc: content, // In real app, this would be encrypted
				speaker,
				confidence,
				timestamp: new Date().toISOString()
			}

			const response = await fetch('/api/transcripts', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(transcriptData)
			})

			if (!response.ok) {
				throw new Error(`Failed to add transcript segment: ${response.statusText}`)
			}

			const newSegment = await response.json()
			
			// If realtime is disabled, manually add to state
			if (!enableRealtime) {
				setTranscripts(prev => [...prev, newSegment].sort(
					(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
				))
			}
			
			return newSegment
		} catch (err) {
			throw new Error(err instanceof Error ? err.message : 'Failed to add transcript segment')
		}
	}

	return {
		transcripts,
		loading,
		error,
		refetch: fetchSessionTranscripts,
		addTranscriptSegment
	}
}
