import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

type Lead = any

type LeadInsert = any

type LeadUpdate = any

export interface LeadFilters {
	search?: string
	status?: 'all' | 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted' | 'demo_appointment' | 'proposal_negotiation' | 'invoice_sent' | 'won' | 'lost'
	dateFrom?: string
	dateTo?: string
	// New: allow filtering by multiple statuses (e.g., canonical + legacy equivalents)
	statusAny?: string[]
}

export interface LeadListOptions {
	filters?: LeadFilters
	sort?: string
	direction?: 'asc' | 'desc'
	page?: number
	pageSize?: number
	userId: string
	ownerIds?: string[] // Optional scope-aware owner list (defaults to [userId]). If empty array, treat as no owner filter (god scope)
}

export class LeadsRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	setClient(client: SupabaseClientAny) {
		this.client = client
	}

	async list(options: LeadListOptions) {
		const { filters = {}, sort = 'date', direction = 'desc', page = 0, pageSize = 10, userId, ownerIds } = options
		
		// Determine effective owner scope: undefined -> [userId]; [] -> god (no filter); non-empty -> provided
		const effectiveOwnerIds = ownerIds === undefined ? [userId] : ownerIds

		let query = this.client
			.from('leads')
			.select('*', { count: 'exact' })
			.is('deleted_at', null)
			// Apply owner filter only if list non-empty
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			

		if (filters.search) {
			query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%,lead_number.ilike.%${filters.search}%`)
		}

		// Support canonical or legacy status, or both via statusAny
		if (filters.statusAny && filters.statusAny.length > 0) {
			query = query.in('status', filters.statusAny)
		} else if (filters.status && filters.status !== 'all') {
			query = query.eq('status', filters.status)
		}

		if (filters.dateFrom) query = query.gte('date', filters.dateFrom)
		if (filters.dateTo) query = query.lte('date', filters.dateTo)

		query = query.order(sort, { ascending: direction === 'asc' })

		const from = page * pageSize
		const to = from + pageSize - 1
		query = query.range(from, to)

		// Apply owner filter conditionally at the end to avoid TypeScript confusion above
		if (effectiveOwnerIds && effectiveOwnerIds.length > 0) {
			query = query.in('owner_id', effectiveOwnerIds)
		}

		const { data, error, count } = await query
		if (error) throw new Error(`Failed to fetch leads: ${error.message}`)

		return { data: data || [], count: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }
	}

	async getById(id: string, userId: string, ownerIds?: string[]): Promise<Lead | null> {
		const effectiveOwnerIds = ownerIds === undefined ? [userId] : ownerIds
		
		let query = this.client
			.from('leads')
			.select('*')
			.eq('id', id)
			.is('deleted_at', null)
			.limit(1)
			.single()
		if (effectiveOwnerIds && effectiveOwnerIds.length > 0) {
			query = query.in('owner_id', effectiveOwnerIds)
		}
		const { data, error } = await query
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch lead: ${error.message}`)
		}
		return data
	}

	async create(lead: Omit<LeadInsert, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Lead> {
		const { data, error } = await this.client
			.from('leads')
			.insert({
				...lead,
				owner_id: userId,
				lead_number: (lead as any).lead_number || `LEAD-${Date.now()}`,
				date: (lead as any).date || new Date().toISOString(),
			})
			.select()
			.single()
		if (error) throw new Error(`Failed to create lead: ${error.message}`)
		return data
	}

	async update(id: string, updates: LeadUpdate, userId: string): Promise<Lead> {
		const { data, error } = await this.client
			.from('leads')
			.update(updates)
			.eq('id', id)
			.eq('owner_id', userId)
			.is('deleted_at', null)
			.select()
			.single()
		if (error) throw new Error(`Failed to update lead: ${error.message}`)
		return data
	}

	async delete(id: string, userId: string): Promise<void> {
		const { error } = await this.client
			.from('leads')
			.update({ deleted_at: new Date().toISOString() })
			.eq('id', id)
			.eq('owner_id', userId)
			.is('deleted_at', null)
		if (error) throw new Error(`Failed to delete lead: ${error.message}`)
	}
}

export const leadsRepository = new LeadsRepository()













































