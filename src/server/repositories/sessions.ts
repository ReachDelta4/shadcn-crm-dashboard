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
			sort = 'created_at',
			direction = 'desc',
			page = 1,
			pageSize = 10,
			userId
		} = options

		let query = this.supabase
			.from('sessions')
			.select('*', { count: 'exact' })
			.eq('owner_id', userId)

		// Apply filters
		if (filters.search) {
			query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
		}

		if (filters.status && filters.status !== 'all') {
			query = query.eq('status', filters.status)
		}

		if (filters.type) {
			query = query.eq('type', filters.type)
		}

		if (filters.dateFrom) {
			query = query.gte('created_at', filters.dateFrom)
		}

		if (filters.dateTo) {
			query = query.lte('created_at', filters.dateTo)
		}

		// Apply sorting
		query = query.order(sort, { ascending: direction === 'asc' })

		// Apply pagination
		const from = (page - 1) * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data: sessions, error, count } = await query

		if (error) {
			throw new Error(`Failed to fetch sessions: ${error.message}`)
		}

		const total = count || 0
		const totalPages = Math.ceil(total / pageSize)

		return {
			sessions: sessions || [],
			total,
			page,
			pageSize,
			totalPages
		}
	}

	async findById(id: string, userId: string): Promise<Session | null> {
		const { data: session, error } = await this.supabase
			.from('sessions')
			.select('*')
			.eq('id', id)
			.eq('owner_id', userId)
			.single()

		if (error) {
			if (error.code === 'PGRST116') {
				return null // Not found
			}
			throw new Error(`Failed to fetch session: ${error.message}`)
		}

		return session
	}

	async create(sessionData: SessionInsert, userId: string): Promise<Session> {
		const { data: session, error } = await this.supabase
			.from('sessions')
			.insert({
				...sessionData,
				owner_id: userId
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to create session: ${error.message}`)
		}

		return session
	}

	async update(id: string, sessionData: SessionUpdate, userId: string): Promise<Session> {
		const { data: session, error } = await this.supabase
			.from('sessions')
			.update({
				...sessionData,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.eq('owner_id', userId)
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to update session: ${error.message}`)
		}

		return session
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.supabase
			.from('sessions')
			.delete()
			.eq('id', id)
			.eq('owner_id', userId)

		if (error) {
			throw new Error(`Failed to delete session: ${error.message}`)
		}
	}

	async getStats(userId: string): Promise<{
		total: number
		active: number
		completed: number
		cancelled: number
	}> {
		const [total, active, completed, cancelled] = await Promise.all([
			this.supabase
				.from('sessions')
				.select('*', { count: 'exact', head: true })
				.eq('owner_id', userId),
			this.supabase
				.from('sessions')
				.select('*', { count: 'exact', head: true })
				.eq('owner_id', userId)
				.eq('status', 'active'),
			this.supabase
				.from('sessions')
				.select('*', { count: 'exact', head: true })
				.eq('owner_id', userId)
				.eq('status', 'completed'),
			this.supabase
				.from('sessions')
				.select('*', { count: 'exact', head: true })
				.eq('owner_id', userId)
				.eq('status', 'cancelled')
		])

		return {
			total: total.count || 0,
			active: active.count || 0,
			completed: completed.count || 0,
			cancelled: cancelled.count || 0
		}
	}
}
