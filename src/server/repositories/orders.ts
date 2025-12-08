import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

type Order = any

type OrderInsert = any

type OrderUpdate = any

export interface OrderFilters {
	search?: string
	status?: 'all' | 'pending' | 'processing' | 'completed' | 'cancelled'
	dateFrom?: string
	dateTo?: string
}

export interface OrderListOptions {
	filters?: OrderFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
	ownerIds?: string[] // Optional scope-aware owner list; [] means no owner filter (god scope)
}

export class OrdersRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	setClient(client: SupabaseClientAny) {
		this.client = client
	}

	async list(options: OrderListOptions) {
		const { filters = {}, sort = 'date', direction = 'desc', page = 0, pageSize = 10, userId, ownerIds } = options

		const effectiveOwnerIds = ownerIds === undefined ? [userId] : ownerIds

		let query = this.client
			.from('orders')
			.select('*', { count: 'exact' })
			// owner filter applied after base filters based on effectiveOwnerIds

		if (filters.search) {
			query = query.or(`order_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
		}

		if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
		if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
		if (filters.dateTo) query = query.lte('date', filters.dateTo)

		query = query.order(sort, { ascending: direction === 'asc' })

		const from = page * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		// Apply owner filter last
		if (effectiveOwnerIds && effectiveOwnerIds.length > 0) {
			query = query.in('owner_id', effectiveOwnerIds)
		}

		const { data, error, count } = await query
		if (error) throw new Error(`Failed to fetch orders: ${error.message}`)
		return { data: data || [], count: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }
	}

	async getById(id: string, userId: string): Promise<Order | null> {
		const { data, error } = await this.client
			.from('orders')
			.select('*')
			.eq('id', id)
			.eq('owner_id', userId)
			.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch order: ${error.message}`)
		}
		return data
	}

	async create(order: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Order> {
		const { data, error } = await this.client
			.from('orders')
			.insert({
				...order,
				owner_id: userId,
				order_number: (order as any).order_number || `ORD-${Date.now()}`,
				date: (order as any).date || new Date().toISOString(),
			})
			.select()
			.single()
		if (error) throw new Error(`Failed to create order: ${error.message}`)
		return data
	}

	async update(id: string, updates: OrderUpdate, userId: string): Promise<Order> {
		const { data, error } = await this.client
			.from('orders')
			.update(updates)
			.eq('id', id)
			.eq('owner_id', userId)
			.select()
			.single()
		if (error) throw new Error(`Failed to update order: ${error.message}`)
		return data
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.client
			.from('orders')
			.delete()
			.eq('id', id)
			.eq('owner_id', userId)
		if (error) throw new Error(`Failed to delete order: ${error.message}`)
	}
}

export const ordersRepository = new OrdersRepository()













































