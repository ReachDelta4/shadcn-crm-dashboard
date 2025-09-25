import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

type ActivityLog = any

type ActivityLogInsert = any

export interface ActivityLogFilters {
	type?: 'user' | 'contact' | 'lead' | 'deal' | 'task' | 'email' | 'all'
	search?: string
	dateFrom?: string
	dateTo?: string
}

export interface ActivityLogListOptions {
	filters?: ActivityLogFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
}

export class ActivityLogsRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	setClient(client: SupabaseClientAny) {
		this.client = client
	}

	async list(options: ActivityLogListOptions) {
		const { filters = {}, sort = 'timestamp', direction = 'desc', page = 0, pageSize = 20, userId } = options

		let query = this.client
			.from('activity_logs')
			.select('*', { count: 'exact' })
			.eq('owner_id', userId)

		if (filters.type && filters.type !== 'all') query = query.eq('type', filters.type)
		if (filters.search) {
			query = query.or(`description.ilike.%${filters.search}%,entity.ilike.%${filters.search}%,user.ilike.%${filters.search}%`)
		}
		if (filters.dateFrom) query = query.gte('timestamp', filters.dateFrom)
		if (filters.dateTo) query = query.lte('timestamp', filters.dateTo)

		query = query.order(sort, { ascending: direction === 'asc' })

		const from = page * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data, error, count } = await query
		if (error) throw new Error(`Failed to fetch activity logs: ${error.message}`)
		return { data: data || [], count: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }
	}

	async create(log: Omit<ActivityLogInsert, 'id' | 'created_at'>, userId: string) {
		const { data, error } = await this.client
			.from('activity_logs')
			.insert({ ...log, owner_id: userId, timestamp: (log as any).timestamp || new Date().toISOString() })
			.select()
			.single()
		if (error) throw new Error(`Failed to create activity log: ${error.message}`)
		return data
	}
}

export const activityLogsRepository = new ActivityLogsRepository()













































