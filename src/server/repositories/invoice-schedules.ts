import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface InvoicePaymentSchedule {
	id: string
	invoice_id: string
	invoice_line_id: string | null
	installment_num: number
	due_at_utc: string
	amount_minor: number
	description: string
	status: 'pending' | 'paid' | 'overdue'
	paid_at?: string | null
	created_at: string
}

export interface CreatePaymentScheduleInput {
	invoice_id: string
	invoice_line_id?: string | null
	installment_num: number
	due_at_utc: string
	amount_minor: number
	description: string
	status?: 'pending' | 'paid' | 'overdue'
}

export interface RecurringRevenueSchedule {
	id: string
	invoice_line_id: string
	cycle_num: number
	billing_at_utc: string
	amount_minor: number
	description: string
	status: 'scheduled' | 'billed' | 'cancelled'
	billed_at?: string | null
	created_at: string
}

export interface CreateRecurringScheduleInput {
	invoice_line_id: string
	cycle_num: number
	billing_at_utc: string
	amount_minor: number
	description: string
	status?: 'scheduled' | 'billed' | 'cancelled'
}

export class InvoicePaymentSchedulesRepository {
	constructor(private client: SupabaseClientAny = defaultClient) {}

	async bulkCreate(schedules: CreatePaymentScheduleInput[]): Promise<InvoicePaymentSchedule[]> {
		const { data, error } = await this.client
			.from('invoice_payment_schedules')
			.insert(schedules)
			.select()
		if (error) throw new Error(`Failed to create payment schedules: ${error.message}`)
		return (data || []) as InvoicePaymentSchedule[]
	}

	async findByInvoiceId(invoiceId: string): Promise<InvoicePaymentSchedule[]> {
		const { data, error } = await this.client
			.from('invoice_payment_schedules')
			.select('*')
			.eq('invoice_id', invoiceId)
			.order('due_at_utc', { ascending: true })
		if (error) throw new Error(`Failed to fetch payment schedules: ${error.message}`)
		return (data || []) as InvoicePaymentSchedule[]
	}

	async getById(id: string): Promise<InvoicePaymentSchedule | null> {
		const { data, error } = await this.client
			.from('invoice_payment_schedules')
			.select('*')
			.eq('id', id)
			.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch payment schedule: ${error.message}`)
		}
		return data as InvoicePaymentSchedule
	}

	async markPaid(id: string, whenIso: string): Promise<InvoicePaymentSchedule> {
		const { data, error } = await this.client
			.from('invoice_payment_schedules')
			.update({ status: 'paid', paid_at: whenIso })
			.eq('id', id)
			.select()
			.single()
		if (error) throw new Error(`Failed to mark schedule paid: ${error.message}`)
		return data as InvoicePaymentSchedule
	}

	async countUnpaidByInvoiceId(invoiceId: string): Promise<number> {
		const { count, error } = await this.client
			.from('invoice_payment_schedules')
			.select('*', { count: 'exact', head: true })
			.eq('invoice_id', invoiceId)
			.neq('status', 'paid')
		if (error) throw new Error(`Failed to count unpaid schedules: ${error.message}`)
		return count || 0
	}
}

export class RecurringRevenueSchedulesRepository {
	constructor(private client: SupabaseClientAny = defaultClient) {}

	async bulkCreate(schedules: CreateRecurringScheduleInput[]): Promise<RecurringRevenueSchedule[]> {
		const { data, error } = await this.client
			.from('recurring_revenue_schedules')
			.insert(schedules)
			.select()
		if (error) throw new Error(`Failed to create recurring schedules: ${error.message}`)
		return (data || []) as RecurringRevenueSchedule[]
	}

	async findByLineId(lineId: string): Promise<RecurringRevenueSchedule[]> {
		const { data, error } = await this.client
			.from('recurring_revenue_schedules')
			.select('*')
			.eq('invoice_line_id', lineId)
			.order('billing_at_utc', { ascending: true })
		if (error) throw new Error(`Failed to fetch recurring schedules: ${error.message}`)
		return (data || []) as RecurringRevenueSchedule[]
	}

	async getById(id: string): Promise<RecurringRevenueSchedule | null> {
		const { data, error } = await this.client
			.from('recurring_revenue_schedules')
			.select('*')
			.eq('id', id)
			.single()
		if (error) {
			if ((error as any).code === 'PGRST116') return null
			throw new Error(`Failed to fetch recurring schedule: ${error.message}`)
		}
		return data as RecurringRevenueSchedule
	}

	async markBilled(id: string, whenIso: string): Promise<RecurringRevenueSchedule> {
		const { data, error } = await this.client
			.from('recurring_revenue_schedules')
			.update({ status: 'billed', billed_at: whenIso })
			.eq('id', id)
			.select()
			.single()
		if (error) throw new Error(`Failed to mark recurring billed: ${error.message}`)
		return data as RecurringRevenueSchedule
	}
}


