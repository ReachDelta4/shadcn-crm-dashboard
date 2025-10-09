import { Product } from '@/server/repositories/products'
import { ProductPaymentPlan } from '@/server/repositories/product-payment-plans'

export interface LineItemInput {
	product_id: string
	quantity: number
	unit_price_override_minor?: number
	discount_type?: 'percent' | 'amount'
	discount_value?: number
	payment_plan_id?: string | null
}

export interface CalculatedLineItem {
	product_id: string
	quantity: number
	unit_price_minor: number
	subtotal_minor: number
	discount_minor: number
	tax_minor: number
	total_minor: number
	cogs_minor: number
	margin_minor: number
	payment_plan_id: string | null
}

export interface InvoiceCalculation {
	lines: CalculatedLineItem[]
	subtotal_minor: number
	total_discount_minor: number
	total_tax_minor: number
	total_minor: number
	total_cogs_minor: number
	total_margin_minor: number
}

export interface PaymentScheduleEntry {
	installment_num: number
	due_at_utc: string
	amount_minor: number
	description: string
}

export interface RecurringScheduleEntry {
	cycle_num: number
	billing_at_utc: string
	amount_minor: number
	description: string
}

/**
 * Calculate a single line item's totals
 */
export function calculateLineItem(
	product: Product,
	quantity: number,
	unitPriceOverride?: number,
	discountType?: 'percent' | 'amount',
	discountValue?: number
): CalculatedLineItem {
	const unitPrice = unitPriceOverride ?? product.price_minor
	const subtotal = unitPrice * quantity

	// Apply discount
	let discount = 0
	if (discountValue && discountValue > 0) {
		if (discountType === 'percent') {
			discount = Math.floor((subtotal * discountValue) / 10000) // bp to minor
		} else {
			discount = discountValue
		}
	} else if (product.discount_type && product.discount_value) {
		if (product.discount_type === 'percent') {
			discount = Math.floor((subtotal * product.discount_value) / 10000)
		} else {
			discount = product.discount_value
		}
	}

	const afterDiscount = subtotal - discount

	// Calculate tax (on discounted amount)
	const tax = Math.floor((afterDiscount * product.tax_rate_bp) / 10000)
	const total = afterDiscount + tax

	// Calculate COGS
	let cogs = 0
	if (product.cogs_type && product.cogs_value) {
		if (product.cogs_type === 'percent') {
			cogs = Math.floor((subtotal * product.cogs_value) / 10000)
		} else {
			cogs = product.cogs_value * quantity
		}
	}

	const margin = total - cogs

	return {
		product_id: product.id,
		quantity,
		unit_price_minor: unitPrice,
		subtotal_minor: subtotal,
		discount_minor: discount,
		tax_minor: tax,
		total_minor: total,
		cogs_minor: cogs,
		margin_minor: margin,
		payment_plan_id: null,
	}
}

/**
 * Calculate entire invoice totals from line items
 */
export function calculateInvoice(
	products: Product[],
	lineInputs: LineItemInput[]
): InvoiceCalculation {
	const lines: CalculatedLineItem[] = []

	for (const input of lineInputs) {
		const product = products.find(p => p.id === input.product_id)
		if (!product) throw new Error(`Product not found: ${input.product_id}`)

		const calculated = calculateLineItem(
			product,
			input.quantity,
			input.unit_price_override_minor,
			input.discount_type,
			input.discount_value
		)

		calculated.payment_plan_id = input.payment_plan_id || null
		lines.push(calculated)
	}

	const subtotal = lines.reduce((sum, l) => sum + l.subtotal_minor, 0)
	const totalDiscount = lines.reduce((sum, l) => sum + l.discount_minor, 0)
	const totalTax = lines.reduce((sum, l) => sum + l.tax_minor, 0)
	const total = lines.reduce((sum, l) => sum + l.total_minor, 0)
	const totalCogs = lines.reduce((sum, l) => sum + l.cogs_minor, 0)
	const totalMargin = lines.reduce((sum, l) => sum + l.margin_minor, 0)

	return {
		lines,
		subtotal_minor: subtotal,
		total_discount_minor: totalDiscount,
		total_tax_minor: totalTax,
		total_minor: total,
		total_cogs_minor: totalCogs,
		total_margin_minor: totalMargin,
	}
}

/**
 * Generate payment schedule for a payment plan
 */
export function generatePaymentSchedule(
	plan: ProductPaymentPlan,
	lineTotal: number,
	invoiceDate: Date
): PaymentScheduleEntry[] {
	const safeDownPayment = Math.max(0, Math.min(plan.down_payment_minor || 0, lineTotal))
	const remainingRaw = lineTotal - safeDownPayment
	const remaining = Math.max(0, remainingRaw)
	const installmentAmount = Math.floor(remaining / plan.num_installments)
	const lastInstallmentAmount = remaining - (installmentAmount * (plan.num_installments - 1))

	const schedule: PaymentScheduleEntry[] = []

	// Down payment (if any)
	if (safeDownPayment > 0) {
		schedule.push({
			installment_num: 0,
			due_at_utc: invoiceDate.toISOString(),
			amount_minor: safeDownPayment,
			description: 'Down payment',
		})
	}

	// Installments
	for (let i = 1; i <= plan.num_installments; i++) {
		const dueDate = calculateNextDueDate(invoiceDate, i, plan.interval_type, plan.interval_days)
		const amount = i === plan.num_installments ? lastInstallmentAmount : installmentAmount

		schedule.push({
			installment_num: i,
			due_at_utc: dueDate.toISOString(),
			amount_minor: amount,
			description: `Installment ${i} of ${plan.num_installments}`,
		})
	}

	return schedule
}

/**
 * Generate recurring revenue schedule (horizon projection)
 */
export function generateRecurringSchedule(
	product: Product,
	lineTotal: number,
	startDate: Date,
	horizonMonths = 12,
	cyclesCount?: number
): RecurringScheduleEntry[] {
	if (!product.recurring_interval) return []

	const schedule: RecurringScheduleEntry[] = []
	const maxCycles = cyclesCount ?? calculateMaxCycles(product.recurring_interval, horizonMonths)

	for (let cycle = 1; cycle <= maxCycles; cycle++) {
		const billingDate = calculateNextDueDate(
			startDate,
			cycle,
			product.recurring_interval,
			product.recurring_interval_days
		)

		schedule.push({
			cycle_num: cycle,
			billing_at_utc: billingDate.toISOString(),
			amount_minor: lineTotal,
			description: `Cycle ${cycle} - ${product.name}`,
		})
	}

	return schedule
}

/**
 * Calculate next due date based on interval type
 */
function calculateNextDueDate(
	baseDate: Date,
	multiplier: number,
	intervalType: string,
	customDays?: number | null
): Date {
	const date = new Date(baseDate)

	switch (intervalType) {
		case 'weekly':
			date.setDate(date.getDate() + (7 * multiplier))
			break
		case 'monthly':
			date.setMonth(date.getMonth() + multiplier)
			break
		case 'quarterly':
			date.setMonth(date.getMonth() + (3 * multiplier))
			break
		case 'semiannual':
			date.setMonth(date.getMonth() + (6 * multiplier))
			break
		case 'annual':
			date.setFullYear(date.getFullYear() + multiplier)
			break
		case 'custom_days':
			date.setDate(date.getDate() + ((customDays || 1) * multiplier))
			break
		default:
			throw new Error(`Unknown interval type: ${intervalType}`)
	}

	return date
}

/**
 * Calculate maximum cycles within horizon
 */
function calculateMaxCycles(intervalType: string, horizonMonths: number): number {
	switch (intervalType) {
		case 'weekly':
			return Math.floor((horizonMonths * 30) / 7)
		case 'monthly':
			return horizonMonths
		case 'quarterly':
			return Math.floor(horizonMonths / 3)
		case 'semiannual':
			return Math.floor(horizonMonths / 6)
		case 'annual':
			return Math.floor(horizonMonths / 12)
		default:
			return horizonMonths // fallback
	}
}


