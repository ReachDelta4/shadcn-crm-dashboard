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

function mapDbTranscript(row: any): any {
	return {
		id: row.id,
		session_id: row.session_id,
		content_enc: row.text_enc,
		speaker: row.speaker,
		timestamp: row.created_at,
		created_at: row.created_at,
	}
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
			sort = 'created_at',
			direction = 'asc',
			page = 1,
			pageSize = 50,
		} = options

		const sortColumn = ['created_at'].includes(sort) ? sort : 'created_at'

		let query = this.supabase
			.from('transcripts')
			.select('id,session_id,speaker,text_enc,created_at', { count: 'exact' })

		if (filters.sessionId) {
			query = query.eq('session_id', filters.sessionId)
		}

		if (filters.search) {
			query = query.ilike('text_enc', `%${filters.search}%`)
		}

		if (filters.speaker) {
			query = query.eq('speaker', filters.speaker)
		}

		if (filters.dateFrom) {
			query = query.gte('created_at', filters.dateFrom)
		}

		if (filters.dateTo) {
			query = query.lte('created_at', filters.dateTo)
		}

		query = query.order(sortColumn, { ascending: direction === 'asc' })

		const from = (page - 1) * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data: rows, error, count } = await query
		if (error) throw new Error(`Failed to fetch transcripts: ${error.message}`)

		const transcripts = (rows || []).map(mapDbTranscript)
		const total = count || 0
		const totalPages = Math.ceil(total / pageSize)

		return { transcripts, total, page, pageSize, totalPages }
	}

	async findBySessionId(sessionId: string, _userId: string): Promise<Transcript[]> {
		const { data: rows, error } = await this.supabase
			.from('transcripts')
			.select('id,session_id,speaker,text_enc,created_at')
			.eq('session_id', sessionId)
			.order('created_at', { ascending: true })
		if (error) throw new Error(`Failed to fetch session transcripts: ${error.message}`)
		return (rows || []).map(mapDbTranscript)
	}

	async findById(id: string, _userId: string): Promise<Transcript | null> {
		const { data: row, error } = await this.supabase
			.from('transcripts')
			.select('id,session_id,speaker,text_enc,created_at')
			.eq('id', id)
			.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch transcript: ${error.message}`)
		}
		return mapDbTranscript(row)
	}

	async create(transcriptData: TranscriptInsert, _userId: string): Promise<Transcript> {
		const sessionId = (transcriptData as any).session_id
		const speaker = (transcriptData as any).speaker || 'Speaker'
		const textEnc = (transcriptData as any).content_enc || (transcriptData as any).text_enc

		const clientTranscriptId = (transcriptData as any).client_transcript_id || (transcriptData as any).clientId || null

		let newId: any = null
		let rpcErr: any = null

		if (clientTranscriptId) {
			const { data, error } = await (this.supabase as any)
				.rpc('add_transcript_safe', { p_session_id: sessionId, p_speaker: speaker, p_text_enc: textEnc, p_client_transcript_id: clientTranscriptId })
			newId = data
			rpcErr = error
			if (rpcErr) {
				const fallback = await (this.supabase as any)
					.rpc('add_transcript', { session_id: sessionId, speaker, text_enc: textEnc })
				newId = fallback.data
				rpcErr = fallback.error
			}
		} else {
			const res = await (this.supabase as any)
				.rpc('add_transcript', { session_id: sessionId, speaker, text_enc: textEnc })
			newId = res.data
			rpcErr = res.error
		}
		if (rpcErr) throw new Error(`Failed to create transcript: ${rpcErr.message}`)

		const { data: row, error } = await this.supabase
			.from('transcripts')
			.select('id,session_id,speaker,text_enc,created_at')
			.eq('id', newId)
			.single()
		if (error) throw new Error(`Failed to fetch created transcript: ${error.message}`)
		return mapDbTranscript(row)
	}

	async update(id: string, transcriptData: TranscriptUpdate, _userId: string): Promise<Transcript> {
		const updates: any = {}
		if ((transcriptData as any).content_enc) updates.text_enc = (transcriptData as any).content_enc
		if ((transcriptData as any).speaker) updates.speaker = (transcriptData as any).speaker
		const { error: updErr } = await this.supabase.from('transcripts').update(updates).eq('id', id)
		if (updErr) throw new Error(`Failed to update transcript: ${updErr.message}`)
		const { data: row, error } = await this.supabase
			.from('transcripts')
			.select('id,session_id,speaker,text_enc,created_at')
			.eq('id', id)
			.single()
		if (error) throw new Error(`Failed to fetch transcript: ${error.message}`)
		return mapDbTranscript(row)
	}

	async delete(id: string, _userId: string): Promise<void> {
		const { error } = await this.supabase.from('transcripts').delete().eq('id', id)
		if (error) throw new Error(`Failed to delete transcript: ${error.message}`)
	}
}
