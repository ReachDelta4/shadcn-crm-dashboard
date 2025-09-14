import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

type Invoice = any

type InvoiceInsert = any

type InvoiceUpdate = any

export interface InvoiceFilters {
	search?: string
	status?: 'all' | 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
	dateFrom?: string
	dateTo?: string
}

export interface InvoiceListOptions {
	filters?: InvoiceFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
}

export class InvoicesRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	setClient(client: SupabaseClientAny) {
		this.client = client
	}

	async list(options: InvoiceListOptions) {
		const { filters = {}, sort = 'date', direction = 'desc', page = 0, pageSize = 10, userId } = options

		let query = this.client
			.from('invoices')
			.select('*', { count: 'exact' })
			.eq('owner_id', userId)

		if (filters.search) {
			query = query.or(`invoice_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
		}

		if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
		if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
		if (filters.dateTo) query = query.lte('date', filters.dateTo)

		query = query.order(sort, { ascending: direction === 'asc' })

		const from = page * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		const { data, error, count } = await query
		if (error) throw new Error(`Failed to fetch invoices: ${error.message}`)
		return { data: data || [], count: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }
	}

	async getById(id: string, userId: string): Promise<Invoice | null> {
		const { data, error } = await this.client
			.from('invoices')
			.select('*')
			.eq('id', id)
			.eq('owner_id', userId)
			.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch invoice: ${error.message}`)
		}
		return data
	}

	async create(invoice: Omit<InvoiceInsert, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Invoice> {
		const { data, error } = await this.client
			.from('invoices')
			.insert({
				...invoice,
				owner_id: userId,
				invoice_number: (invoice as any).invoice_number || `INV-${Date.now()}`,
				date: (invoice as any).date || new Date().toISOString(),
			})
			.select()
			.single()
		if (error) throw new Error(`Failed to create invoice: ${error.message}`)
		return data
	}

	async update(id: string, updates: InvoiceUpdate, userId: string): Promise<Invoice> {
		const { data, error } = await this.client
			.from('invoices')
			.update(updates)
			.eq('id', id)
			.eq('owner_id', userId)
			.select()
			.single()
		if (error) throw new Error(`Failed to update invoice: ${error.message}`)
		return data
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.client
			.from('invoices')
			.delete()
			.eq('id', id)
			.eq('owner_id', userId)
		if (error) throw new Error(`Failed to delete invoice: ${error.message}`)
	}
}

export const invoicesRepository = new InvoicesRepository()











