import { createClient } from '@supabase/supabase-js'

// Use untyped client until schema is applied and types regenerated
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

// Temporary types until schema is applied
type Session = any
type SessionInsert = any
type SessionUpdate = any

type SupabaseClientAny = typeof defaultClient

export interface SessionFilters {
	search?: string
	status?: 'all' | 'active' | 'completed' | 'cancelled'
	dateFrom?: string
	dateTo?: string
	type?: string
}

export interface SessionListOptions {
	filters?: SessionFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
}

function mapDbSession(row: any): any {
	const startedAt = row.started_at ? new Date(row.started_at) : null
	const fallbackTitle = startedAt ? `Session @ ${startedAt.toLocaleTimeString('en-GB', { hour12: false })}` : 'Session'
	// Heuristic: if title_enc looks like base64/opaque, use fallback for display
	const looksEncoded = typeof row.title_enc === 'string' && /^[A-Za-z0-9+/=]{20,}$/.test(row.title_enc)
	return {
		id: row.id,
		owner_id: row.user_id,
		subject_id: row.subject_id || null,
		title: (row.title_enc && !looksEncoded) ? row.title_enc : fallbackTitle,
		type: row.session_type,
		status: row.ended_at ? 'completed' : 'active',
		started_at: row.started_at,
		ended_at: row.ended_at,
		created_at: row.started_at,
		updated_at: row.updated_at,
	}
}

export class SessionsRepository {
	constructor(private supabase: SupabaseClientAny = defaultClient) {}

	async findAll(options: SessionListOptions): Promise<{
		sessions: Session[]
		total: number
		page: number
		pageSize: number
		totalPages: number
	}> {
		const {
			filters = {},
			sort = 'started_at',
			direction = 'desc',
			page = 1,
			pageSize = 10,
			userId
		} = options

		const sortColumn = ['started_at','updated_at','ended_at'].includes(sort) ? sort : 'started_at'

		let query = this.supabase
			.from('sessions')
			.select('id,user_id,subject_id,title_enc,session_type,started_at,ended_at,updated_at', { count: 'exact' })
			.eq('user_id', userId)

		// Apply filters
		if (filters.search) {
			query = query.ilike('title_enc', `%${filters.search}%`)
		}

		if (filters.status && filters.status !== 'all') {
			if (filters.status === 'active') {
				query = query.is('ended_at', null)
			} else if (filters.status === 'completed' || filters.status === 'cancelled') {
				query = query.not('ended_at', 'is', null)
			}
		}

		if (filters.type) {
			query = query.eq('session_type', filters.type)
		}

		if (filters.dateFrom) {
			query = query.gte('started_at', filters.dateFrom)
		}

		if (filters.dateTo) {
			query = query.lte('started_at', filters.dateTo)
		}

		// Apply sorting
		query = query.order(sortColumn, { ascending: direction === 'asc' })

		// Apply pagination (1-based to 0-based conversion)
		const from = (page - 1) * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data: rows, error, count } = await query

		if (error) {
			throw new Error(`Failed to fetch sessions: ${error.message}`)
		}

		const sessions = (rows || []).map(mapDbSession)
		const total = count || 0
		const totalPages = Math.ceil(total / pageSize)

		return { sessions, total, page, pageSize, totalPages }
	}

	async findById(id: string, userId: string): Promise<Session | null> {
		const { data: row, error } = await this.supabase
			.from('sessions')
			.select('id,user_id,subject_id,title_enc,session_type,started_at,ended_at,updated_at')
			.eq('id', id)
			.eq('user_id', userId)
			.single()

		if (error) {
			if ((error as any).code === 'PGRST116') {
				return null // Not found
			}
			throw new Error(`Failed to fetch session: ${error.message}`)
		}

		return mapDbSession(row)
	}

	async create(sessionData: SessionInsert, userId: string): Promise<Session> {
		const requestedType = (sessionData as any)?.type || 'ask'
		const { data: newSessionId, error: rpcError } = await (this.supabase as any)
			.rpc('get_or_create_active_session', { requested_type: requestedType })

		if (rpcError) {
			throw new Error(`Failed to create session: ${rpcError.message}`)
		}

		const { data: row, error } = await this.supabase
			.from('sessions')
			.select('id,user_id,subject_id,title_enc,session_type,started_at,ended_at,updated_at')
			.eq('id', newSessionId)
			.eq('user_id', userId)
			.single()

		if (error) {
			throw new Error(`Failed to fetch created session: ${error.message}`)
		}

		return mapDbSession(row)
	}

	async update(id: string, sessionData: SessionUpdate, userId: string): Promise<Session> {
		// Support title update and ending a session
		if ((sessionData as any)?.status === 'completed' || (sessionData as any)?.status === 'cancelled') {
			const { error: endErr } = await (this.supabase as any).rpc('end_session', { session_id: id })
			if (endErr) throw new Error(`Failed to end session: ${endErr.message}`)
		}

		if ((sessionData as any)?.title) {
			const { error: updErr } = await this.supabase
				.from('sessions')
				.update({ title_enc: (sessionData as any).title })
				.eq('id', id)
				.eq('user_id', userId)
			if (updErr) throw new Error(`Failed to update session: ${updErr.message}`)
		}

		const { data: row, error } = await this.supabase
			.from('sessions')
			.select('id,user_id,subject_id,title_enc,session_type,started_at,ended_at,updated_at')
			.eq('id', id)
			.eq('user_id', userId)
			.single()
		if (error) throw new Error(`Failed to fetch session: ${error.message}`)
		return mapDbSession(row)
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.supabase
			.from('sessions')
			.delete()
			.eq('id', id)
			.eq('user_id', userId)
		if (error) throw new Error(`Failed to delete session: ${error.message}`)
	}

	async getStats(userId: string): Promise<{
		total: number
		active: number
		completed: number
		cancelled: number
	}> {
		const [total, active, completed] = await Promise.all([
			this.supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
			this.supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId).is('ended_at', null),
			this.supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('ended_at', 'is', null),
		])

		return {
			total: (total.count as number) || 0,
			active: (active.count as number) || 0,
			completed: (completed.count as number) || 0,
			cancelled: 0,
		}
	}
}
