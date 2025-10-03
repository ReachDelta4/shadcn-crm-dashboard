import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface Product {
	id: string
	org_id: string | null
	owner_id: string
	name: string
	sku: string | null
	currency: string
	price_minor: number
	tax_rate_bp: number
	cogs_type: 'percent' | 'amount' | null
	cogs_value: number | null
	discount_type: 'percent' | 'amount' | null
	discount_value: number | null
	recurring_interval: 'weekly'|'monthly'|'quarterly'|'semiannual'|'annual'|'custom_days' | null
	recurring_interval_days: number | null
	active: boolean
	created_at: string
	updated_at: string
}

export interface ProductInsert {
	org_id?: string | null
	name: string
	sku?: string | null
	currency?: string
	price_minor: number
	tax_rate_bp?: number
	cogs_type?: 'percent' | 'amount' | null
	cogs_value?: number | null
	discount_type?: 'percent' | 'amount' | null
	discount_value?: number | null
	recurring_interval?: 'weekly'|'monthly'|'quarterly'|'semiannual'|'annual'|'custom_days' | null
	recurring_interval_days?: number | null
	active?: boolean
}

export interface ProductUpdate extends Partial<ProductInsert> {}

export interface ProductListOptions {
	orgId?: string | null
	active?: boolean | 'all'
	search?: string
	page?: number
	pageSize?: number
}

export class ProductsRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	setClient(client: SupabaseClientAny) {
		this.client = client
	}

	async list(options: ProductListOptions & { ownerId: string; role: string }): Promise<{ data: Product[]; count: number; page: number; pageSize: number; totalPages: number }>{
		const { orgId = null, active = true, search, page = 0, pageSize = 20, role } = options
		let query = this.client.from('products').select('*', { count: 'exact' })

		// Visibility: Manager/Executive see org-level products; Rep/Lead see org-level products (no create unless elevated)
		if (orgId) {
			query = query.eq('org_id', orgId)
		} else {
			// If orgId is null, fallback to owner scope
			query = query.eq('owner_id', options.ownerId)
		}

		if (active !== 'all') {
			query = query.eq('active', !!active)
		}

		if (search) {
			query = query.ilike('name', `%${search}%`)
		}

		const from = page * pageSize
		const to = from + pageSize - 1
		query = query.order('name', { ascending: true }).range(from, to)

		const { data, error, count } = await query
		if (error) throw new Error(`Failed to fetch products: ${error.message}` )
		return { data: (data || []) as Product[], count: count || 0, page, pageSize, totalPages: Math.ceil((count || 0) / pageSize) }
	}

	async getById(id: string, orgId: string | null, ownerId: string, role: string): Promise<Product | null> {
		let query = this.client.from('products').select('*').eq('id', id)
		if (orgId) query = query.eq('org_id', orgId)
		else query = query.eq('owner_id', ownerId)
		const { data, error } = await query.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch product: ${error.message}`)
		}
		return data as Product
	}

	async create(input: ProductInsert, ownerId: string, orgId: string | null, role: string): Promise<Product> {
		// Only manager/executive/god should create org-wide products
		const isElevated = ['manager','executive','god'].includes(role)
		const row: any = {
			...input,
			owner_id: ownerId,
			org_id: isElevated ? (input.org_id ?? orgId ?? null) : null,
			currency: input.currency || 'USD',
			tax_rate_bp: input.tax_rate_bp ?? 0,
			active: input.active ?? true,
		}
		const { data, error } = await this.client.from('products').insert(row).select().single()
		if (error) throw new Error(`Failed to create product: ${error.message}`)
		return data as Product
	}

	async update(id: string, updates: ProductUpdate, ownerId: string, orgId: string | null, role: string): Promise<Product> {
		// Only elevated can change org_id; reps can edit own products only
		const isElevated = ['manager','executive','god'].includes(role)
		let query = this.client.from('products').update({
			...updates,
			org_id: isElevated ? (updates.org_id ?? orgId ?? null) : undefined,
		}).eq('id', id)
		if (isElevated && orgId) query = query.eq('org_id', orgId)
		if (!isElevated) query = query.eq('owner_id', ownerId)
		const { data, error } = await query.select().single()
		if (error) throw new Error(`Failed to update product: ${error.message}`)
		return data as Product
	}

	async delete(id: string, ownerId: string, orgId: string | null, role: string): Promise<void> {
		const isElevated = ['manager','executive','god'].includes(role)
		let query = this.client.from('products').delete().eq('id', id)
		if (isElevated && orgId) query = query.eq('org_id', orgId)
		if (!isElevated) query = query.eq('owner_id', ownerId)
		const { error } = await query
		if (error) throw new Error(`Failed to delete product: ${error.message}`)
	}
}
