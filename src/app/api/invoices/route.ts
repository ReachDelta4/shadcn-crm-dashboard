import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { InvoicesRepository } from '@/server/repositories/invoices'
import { InvoiceLinesRepository } from '@/server/repositories/invoice-lines'
import { InvoicePaymentSchedulesRepository, RecurringRevenueSchedulesRepository } from '@/server/repositories/invoice-schedules'
import { ProductsRepository } from '@/server/repositories/products'
import { ProductPaymentPlansRepository } from '@/server/repositories/product-payment-plans'
import { getUserAndScope } from '@/server/auth/getUserAndScope'
import { calculateInvoice, generatePaymentSchedule, generateRecurringSchedule, type LineItemInput } from '@/server/services/pricing-engine'
import { LeadsRepository } from '@/server/repositories/leads'
import { LeadStatusTransitionsRepository } from '@/server/repositories/lead-status-transitions'

const lineItemSchema = z.object({
	product_id: z.string().uuid(),
	quantity: z.number().int().min(1),
	unit_price_override_minor: z.number().int().min(0).optional(),
	discount_type: z.enum(['percent', 'amount']).optional(),
	discount_value: z.number().int().min(0).optional(),
	payment_plan_id: z.string().uuid().optional(),
})

const invoiceCreateSchema = z.object({
	invoice_number: z.string().optional(),
	customer_name: z.string().min(1, 'Customer name is required'),
	email: z.string().email('Valid email is required'),
	amount: z.coerce.number().min(0).optional(), // Now optional, calculated from line_items
	status: z.enum(['draft','pending','paid','overdue','cancelled']).default('draft'),
	date: z.string().optional(),
	due_date: z.string().optional(),
	items: z.coerce.number().min(0).default(0).optional(),
	payment_method: z.string().optional(),
	line_items: z.array(lineItemSchema).optional(), // New: line items
	lead_id: z.string().uuid().optional(), // New: link to lead
	subject_id: z.string().uuid().optional(), // New: link to subject
})

const invoiceFiltersSchema = z.object({
	search: z.string().nullable().optional().transform(v => v ?? ''),
	status: z.enum(['all','draft','pending','paid','overdue','cancelled']).nullable().optional().transform(v => v ?? 'all'),
	dateFrom: z.string().nullable().optional().transform(v => v ?? undefined),
	dateTo: z.string().nullable().optional().transform(v => v ?? undefined),
	sort: z.string().nullable().optional().transform(v => v ?? 'date'),
	direction: z.enum(['asc','desc']).nullable().optional().transform(v => v ?? 'desc'),
	page: z.coerce.number().min(0).nullable().optional().transform(v => (v == null ? 0 : v)),
	pageSize: z.coerce.number().min(1).max(100).nullable().optional().transform(v => (v == null ? 10 : v)),
})

async function getServerClient() {
	const cookieStore = await cookies()
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll()
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
				},
			},
		}
	)
}

export async function GET(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const { searchParams } = new URL(request.url)
		const filters = invoiceFiltersSchema.parse({
			search: searchParams.get('search'),
			status: searchParams.get('status'),
			dateFrom: searchParams.get('dateFrom'),
			dateTo: searchParams.get('dateTo'),
			sort: searchParams.get('sort'),
			direction: searchParams.get('direction'),
			page: searchParams.get('page'),
			pageSize: searchParams.get('pageSize'),
		})
		const repo = new InvoicesRepository(supabase)
		const result = await repo.list({
			filters: { search: filters.search || undefined, status: filters.status, dateFrom: filters.dateFrom, dateTo: filters.dateTo },
			sort: filters.sort,
			direction: filters.direction,
			page: filters.page,
			pageSize: filters.pageSize,
			userId: user.id,
		})
		return NextResponse.json(result, { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=120' } })
	} catch (error) {
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const supabase = await getServerClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		
		const body = await request.json()
		const validated = invoiceCreateSchema.parse(body)
		
		let finalAmount = validated.amount || 0
		const invoiceData: any = { ...validated }
		let validProducts: any[] = []
		let calculation: any = null
		
		// If line_items provided, calculate totals via pricing engine
		if (validated.line_items && validated.line_items.length > 0) {
			const scope = await getUserAndScope()
			const productsRepo = new ProductsRepository()
			
			// Fetch all products
			const productIds = validated.line_items.map(li => li.product_id)
			const products = await Promise.all(
				productIds.map(id => productsRepo.getById(id, scope.orgId || null, scope.userId, scope.role))
			)
			validProducts = products.filter(p => p !== null) as any[]
			
			// Calculate invoice totals
			calculation = calculateInvoice(validProducts, validated.line_items as LineItemInput[])
			finalAmount = calculation.total_minor
			
			invoiceData.amount = finalAmount / 100 // Convert minor to major
			invoiceData.items = validated.line_items.length
		}
		
		delete invoiceData.line_items // Remove from base invoice insert
		
		const repo = new InvoicesRepository(supabase)
		const invoice = await repo.create(invoiceData, user.id)
		const invoiceId = (invoice as any).id
		
		// Create line items and schedules if provided
		if (validated.line_items && validated.line_items.length > 0 && calculation) {
			const scope = await getUserAndScope()
			const plansRepo = new ProductPaymentPlansRepository()
			const linesRepo = new InvoiceLinesRepository(supabase)
			const paymentSchedulesRepo = new InvoicePaymentSchedulesRepository(supabase)
			const recurringSchedulesRepo = new RecurringRevenueSchedulesRepository(supabase)
			
			// Create invoice lines
			const lineInserts = calculation.lines.map((line: any) => ({
				invoice_id: invoiceId,
				product_id: line.product_id,
				description: validProducts.find(p => p.id === line.product_id)?.name || 'Product',
				quantity: line.quantity,
				unit_price_minor: line.unit_price_minor,
				subtotal_minor: line.subtotal_minor,
				discount_minor: line.discount_minor,
				tax_minor: line.tax_minor,
				total_minor: line.total_minor,
				cogs_minor: line.cogs_minor,
				margin_minor: line.margin_minor,
				payment_plan_id: line.payment_plan_id,
			}))
			
			const createdLines = await linesRepo.bulkCreate(lineInserts)
			
			// Generate schedules for each line
			const invoiceDate = validated.date ? new Date(validated.date) : new Date()
			
			for (let i = 0; i < createdLines.length; i++) {
				const line = createdLines[i]
				const input = validated.line_items[i]
				const product = validProducts.find(p => p.id === line.product_id)
				
				// Payment plan schedules
				if (input.payment_plan_id) {
					const plan = await plansRepo.getById(input.payment_plan_id)
					if (plan) {
						const schedules = generatePaymentSchedule(plan, line.total_minor, invoiceDate)
						const scheduleInserts = schedules.map(s => ({
							invoice_id: invoiceId,
							invoice_line_id: line.id,
							installment_num: s.installment_num,
							due_at_utc: s.due_at_utc,
							amount_minor: s.amount_minor,
							description: s.description,
							status: 'pending' as const,
						}))
						await paymentSchedulesRepo.bulkCreate(scheduleInserts)
					}
				}
				
				// Recurring revenue schedules
				if (product && product.recurring_interval) {
					const schedules = generateRecurringSchedule(product, line.total_minor, invoiceDate, 12)
					const scheduleInserts = schedules.map(s => ({
						invoice_line_id: line.id,
						cycle_num: s.cycle_num,
						billing_at_utc: s.billing_at_utc,
						amount_minor: s.amount_minor,
						description: s.description,
						status: 'scheduled' as const,
					}))
					await recurringSchedulesRepo.bulkCreate(scheduleInserts)
				}
			}
		}

		// If linked to a lead, update lifecycle to invoice_sent and log transition (best-effort)
		if ((validated as any).lead_id) {
			try {
				const leadsRepo = new LeadsRepository()
				const transitionsRepo = new LeadStatusTransitionsRepository()
				const lead = await leadsRepo.getById((validated as any).lead_id, user.id)
				if (lead) {
					await leadsRepo.update((lead as any).id, { status: 'invoice_sent' as any }, user.id)
					await transitionsRepo.create({
						lead_id: (lead as any).id,
						subject_id: (lead as any).subject_id || null,
						actor_id: user.id,
						event_type: 'status_change',
						status_from: (lead as any).status || null,
						status_to: 'invoice_sent',
					})
				}
			} catch {}
		}
 
		// Log activity (best-effort)
		import('@/app/api/_lib/log-activity').then(async ({ logActivity }) => {
			await logActivity(supabase as any, user.id, {
				type: 'deal',
				description: `Invoice created: $${(invoice as any).amount}`,
				entity: (invoice as any).customer_name || (invoice as any).email,
				details: { id: (invoice as any).id }
			})
		}).catch(() => {})
		
		return NextResponse.json(invoice, { status: 201 })
	} catch (error) {
		console.error('[invoices] POST error:', error)
		if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
