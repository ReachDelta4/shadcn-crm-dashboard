import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface InvoiceLine {
	id: string
	invoice_id: string
	product_id: string | null
	description: string
	quantity: number
	unit_price_minor: number
	subtotal_minor: number
	discount_minor: number
	tax_minor: number
	total_minor: number
	cogs_minor: number
	margin_minor: number
	payment_plan_id: string | null
	billing_type?: 'one_time' | 'recurring'
	billing_frequency?: string | null
	billing_interval_days?: number | null
	created_at: string
}

export interface CreateInvoiceLineInput {
	invoice_id: string
	product_id?: string | null
	description: string
	quantity: number
	unit_price_minor: number
	subtotal_minor: number
	discount_minor: number
	tax_minor: number
	total_minor: number
	cogs_minor: number
	margin_minor: number
	payment_plan_id?: string | null
	// Optional fields to satisfy legacy schemas
	billing_type?: 'one_time' | 'recurring'
	billing_frequency?: string | null
	billing_interval_days?: number | null
	tax_rate_bp?: number
	discount_type?: 'percent' | 'amount'
	discount_value?: number
	cogs_type?: 'percent' | 'amount'
	cogs_value?: number
	currency?: string
}

export class InvoiceLinesRepository {
	constructor(private client: SupabaseClientAny = defaultClient) {}

	async bulkCreate(lines: CreateInvoiceLineInput[]): Promise<InvoiceLine[]> {
		// Map inputs to ensure required legacy columns are present when needed
		const rows = lines.map((l: any) => ({
			...l,
			// Back-compat: some schemas require these fields
			billing_type: l.billing_type ?? 'one_time',
			billing_frequency: l.billing_frequency ?? null,
			billing_interval_days: l.billing_interval_days ?? null,
			tax_rate_bp: l.tax_rate_bp ?? undefined,
			discount_type: l.discount_type ?? undefined,
			discount_value: l.discount_value ?? undefined,
			cogs_type: l.cogs_type ?? undefined,
			cogs_value: l.cogs_value ?? undefined,
			currency: l.currency ?? undefined,
		}))
		const { data, error } = await this.client
			.from('invoice_lines')
			.insert(rows)
			.select()
		if (error) throw new Error(`Failed to create invoice lines: ${error.message}`)
		return (data || []) as InvoiceLine[]
	}

	async findByInvoiceId(invoiceId: string): Promise<InvoiceLine[]> {
		const { data, error } = await this.client
			.from('invoice_lines')
			.select('*')
			.eq('invoice_id', invoiceId)
			.order('created_at', { ascending: true })
		if (error) throw new Error(`Failed to fetch invoice lines: ${error.message}`)
		return (data || []) as InvoiceLine[]
	}

	async deleteByInvoiceId(invoiceId: string): Promise<void> {
		const { error } = await this.client
			.from('invoice_lines')
			.delete()
			.eq('invoice_id', invoiceId)
		if (error) throw new Error(`Failed to delete invoice lines: ${error.message}`)
	}
}


