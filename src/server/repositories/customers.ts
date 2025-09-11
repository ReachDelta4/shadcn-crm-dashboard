import { createClient } from '@supabase/supabase-js'

// Use untyped client until schema is applied and types regenerated
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

// Temporary types until schema is applied
type Customer = any
type CustomerInsert = any
type CustomerUpdate = any

type SupabaseClientAny = typeof defaultClient

export interface CustomerFilters {
	search?: string
	status?: 'all' | 'active' | 'inactive' | 'pending'
	dateFrom?: string
	dateTo?: string
}

export interface CustomerListOptions {
	filters?: CustomerFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
}

export class CustomersRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	setClient(client: SupabaseClientAny) {
		this.client = client
	}

	async list(options: CustomerListOptions) {
		const { filters = {}, sort = 'date_joined', direction = 'desc', page = 0, pageSize = 10, userId } = options
		
		let query = this.client
			.from('customers')
			.select('*', { count: 'exact' })
			.eq('owner_id', userId)

		// Apply filters
		if (filters.search) {
			query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%,customer_number.ilike.%${filters.search}%`)
		}

		if (filters.status && filters.status !== 'all') {
			query = query.eq('status', filters.status)
		}

		if (filters.dateFrom) {
			query = query.gte('date_joined', filters.dateFrom)
		}

		if (filters.dateTo) {
			query = query.lte('date_joined', filters.dateTo)
		}

		// Apply sorting
		query = query.order(sort, { ascending: direction === 'asc' })

		// Apply pagination
		const from = page * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data, error, count } = await query

		if (error) {
			throw new Error(`Failed to fetch customers: ${error.message}`)
		}

		return {
			data: data || [],
			count: count || 0,
			page,
			pageSize,
			totalPages: Math.ceil((count || 0) / pageSize)
		}
	}

	async getById(id: string, userId: string): Promise<Customer | null> {
		const { data, error } = await this.client
			.from('customers')
			.select('*')
			.eq('id', id)
			.eq('owner_id', userId)
			.single()

		if (error) {
			// PGRST116: No rows found
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch customer: ${error.message}`)
		}

		return data
	}

	async create(customer: Omit<CustomerInsert, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Customer> {
		const { data, error } = await this.client
			.from('customers')
			.insert({
				...customer,
				owner_id: userId,
				customer_number: (customer as any).customer_number || `CUST-${Date.now()}`
			})
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to create customer: ${error.message}`)
		}

		return data
	}

	async update(id: string, updates: CustomerUpdate, userId: string): Promise<Customer> {
		const { data, error } = await this.client
			.from('customers')
			.update(updates)
			.eq('id', id)
			.eq('owner_id', userId)
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to update customer: ${error.message}`)
		}

		return data
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.client
			.from('customers')
			.delete()
			.eq('id', id)
			.eq('owner_id', userId)

		if (error) {
			throw new Error(`Failed to delete customer: ${error.message}`)
		}
	}
}

export const customersRepository = new CustomersRepository()
