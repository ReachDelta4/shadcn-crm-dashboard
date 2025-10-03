import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface ProductPaymentPlan {
	id: string
	org_id: string | null
	product_id: string
	name: string
	num_installments: number
	interval_type: 'weekly'|'monthly'|'quarterly'|'semiannual'|'annual'|'custom_days'
	interval_days: number | null
	down_payment_minor: number | null
	active: boolean
	created_at: string
	updated_at: string
}

export interface CreatePlanInput {
	org_id?: string | null
	product_id: string
	name: string
	num_installments: number
	interval_type: 'weekly'|'monthly'|'quarterly'|'semiannual'|'annual'|'custom_days'
	interval_days?: number | null
	down_payment_minor?: number | null
	active?: boolean
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {}

export class ProductPaymentPlansRepository {
	constructor(private client: SupabaseClientAny = defaultClient) {}

	async listByProduct(productId: string, activeOnly = true): Promise<ProductPaymentPlan[]> {
		let query = this.client.from('product_payment_plans').select('*').eq('product_id', productId)
		if (activeOnly) query = query.eq('active', true)
		const { data, error } = await query.order('created_at', { ascending: true })
		if (error) throw new Error(`Failed to fetch payment plans: ${error.message}`)
		return (data || []) as ProductPaymentPlan[]
	}

	async getById(id: string): Promise<ProductPaymentPlan | null> {
		const { data, error } = await this.client.from('product_payment_plans').select('*').eq('id', id).single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch plan: ${error.message}`)
		}
		return data as ProductPaymentPlan
	}

	async create(input: CreatePlanInput): Promise<ProductPaymentPlan> {
		const row = {
			...input,
			interval_days: input.interval_type === 'custom_days' ? (input.interval_days ?? 1) : null,
			active: input.active ?? true,
		}
		const { data, error } = await this.client.from('product_payment_plans').insert(row).select().single()
		if (error) throw new Error(`Failed to create plan: ${error.message}`)
		return data as ProductPaymentPlan
	}

	async update(id: string, updates: UpdatePlanInput): Promise<ProductPaymentPlan> {
		const row = {
			...updates,
			interval_days: updates.interval_type === 'custom_days' ? (updates.interval_days ?? 1) : (updates.interval_type ? null : updates.interval_days),
		}
		const { data, error } = await this.client.from('product_payment_plans').update(row).eq('id', id).select().single()
		if (error) throw new Error(`Failed to update plan: ${error.message}`)
		return data as ProductPaymentPlan
	}

	async delete(id: string): Promise<void> {
		const { error } = await this.client.from('product_payment_plans').delete().eq('id', id)
		if (error) throw new Error(`Failed to delete plan: ${error.message}`)
	}
}
