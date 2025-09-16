import { createClient } from '@supabase/supabase-js'

// Use untyped client until schema is applied and types regenerated
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

// Temporary types until schema is applied
type Transcript = any
type TranscriptInsert = any
type TranscriptUpdate = any

type SupabaseClientAny = typeof defaultClient

export interface TranscriptFilters {
	search?: string
	sessionId?: string
	dateFrom?: string
	dateTo?: string
	speaker?: string
}

export interface TranscriptListOptions {
	filters?: TranscriptFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
}

export class TranscriptsRepository {
	constructor(private supabase: SupabaseClientAny = defaultClient) {}

	async findAll(options: TranscriptListOptions): Promise<{
		transcripts: Transcript[]
		total: number
		page: number
		pageSize: number
		totalPages: number
	}> {
		const {
			filters = {},
			sort = 'timestamp',
			direction = 'asc',
			page = 1,
			pageSize = 50,
			userId
		} = options

		let query = this.supabase
			.from('transcripts')
			.select('*', { count: 'exact' })
			.eq('owner_id', userId)

		// Apply filters
		if (filters.search) {
			query = query.ilike('content_enc', `%${filters.search}%`)
		}

		if (filters.sessionId) {
			query = query.eq('session_id', filters.sessionId)
		}

		if (filters.speaker) {
			query = query.eq('speaker', filters.speaker)
		}

		if (filters.dateFrom) {
			query = query.gte('timestamp', filters.dateFrom)
		}

		if (filters.dateTo) {
			query = query.lte('timestamp', filters.dateTo)
		}

		// Apply sorting
		query = query.order(sort, { ascending: direction === 'asc' })

		// Apply pagination
		const from = (page - 1) * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data: transcripts, error, count } = await query

		if (error) {
			throw new Error(`Failed to fetch transcripts: ${error.message}`)
		}

		const total = count || 0
		const totalPages = Math.ceil(total / pageSize)

		return {
			transcripts: transcripts || [],
			total,
			page,
			pageSize,
			totalPages
		}
	}

	async findBySessionId(sessionId: string, userId: string): Promise<Transcript[]> {
		const { data: transcripts, error } = await this.supabase
			.from('transcripts')
			.select('*')
			.eq('session_id', sessionId)
			.eq('owner_id', userId)
			.order('timestamp', { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch session transcripts: ${error.message}`)
		}

		return transcripts || []
	}

	async findById(id: string, userId: string): Promise<Transcript | null> {
		const { data: transcript, error } = await this.supabase
			.from('transcripts')
			.select('*')
			.eq('id', id)
			.eq('owner_id', userId)
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				return null // Not found
			}
			throw new Error(`Failed to fetch transcript: ${error.message}`)
		}

		return transcript
	}

	async create(transcriptData: TranscriptInsert, userId: string): Promise<Transcript> {
		const { data: transcript, error } = await this.supabase
			.from('transcripts')
			.insert({
				...transcriptData,
				owner_id: userId
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to create transcript: ${error.message}`)
		}

		return transcript
	}

	async update(id: string, transcriptData: TranscriptUpdate, userId: string): Promise<Transcript> {
		const { data: transcript, error } = await this.supabase
			.from('transcripts')
			.update(transcriptData)
			.eq('id', id)
			.eq('owner_id', userId)
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to update transcript: ${error.message}`)
		}

		return transcript
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.supabase
			.from('transcripts')
			.delete()
			.eq('id', id)
			.eq('owner_id', userId)

		if (error) {
			throw new Error(`Failed to delete transcript: ${error.message}`)
		}
	}

	async getSessionStats(sessionId: string, userId: string): Promise<{
		totalSegments: number
		speakers: string[]
		duration: number
		wordCount: number
	}> {
		const { data: transcripts, error } = await this.supabase
			.from('transcripts')
			.select('*')
			.eq('session_id', sessionId)
			.eq('owner_id', userId)

		if (error) {
			throw new Error(`Failed to fetch session stats: ${error.message}`)
		}

		const segments = transcripts || []
		const speakers = [...new Set(segments.map(t => t.speaker).filter(Boolean))]
		const wordCount = segments.reduce((sum, t) => {
			// Estimate word count from content (encrypted, so this is rough)
			return sum + (t.content_enc?.length || 0) / 5
		}, 0)

		// Calculate duration from timestamps if available
		const timestamps = segments.map(t => new Date(t.timestamp).getTime()).filter(Boolean)
		const duration = timestamps.length > 1 
			? (Math.max(...timestamps) - Math.min(...timestamps)) / 1000 
			: 0

		return {
			totalSegments: segments.length,
			speakers,
			duration,
			wordCount: Math.round(wordCount)
		}
	}

	// Realtime subscription helper
	subscribeToSession(sessionId: string, callback: (payload: any) => void) {
		return this.supabase
			.channel(`transcripts:${sessionId}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'transcripts',
					filter: `session_id=eq.${sessionId}`
				},
				callback
			)
			.subscribe()
	}
}
