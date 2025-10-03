export type LeadStatus = 
	| 'new'
	| 'contacted'
	| 'qualified'
	| 'demo_appointment'
	| 'proposal_negotiation'
	| 'invoice_sent'
	| 'won'
	| 'lost'

const ORDER: LeadStatus[] = [
	'new',
	'contacted',
	'qualified',
	'demo_appointment',
	'proposal_negotiation',
	'invoice_sent',
	'won',
	'lost',
]

export function isTransitionAllowed(from: LeadStatus, to: LeadStatus): boolean {
	if (from === to) return false
	// Strict forward movement only, except admin override (handled at API level)
	const iFrom = ORDER.indexOf(from)
	const iTo = ORDER.indexOf(to)
	return iTo >= iFrom // allow forward or sideways to terminal (won/lost)
}

export function validateStatus(status: string): status is LeadStatus {
	const validStatuses: LeadStatus[] = ORDER
	return validStatuses.includes(status as LeadStatus)
}
