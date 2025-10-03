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
}

export class InvoiceLinesRepository {
	constructor(private client: SupabaseClientAny = defaultClient) {}

	async bulkCreate(lines: CreateInvoiceLineInput[]): Promise<InvoiceLine[]> {
		const { data, error } = await this.client
			.from('invoice_lines')
			.insert(lines)
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


