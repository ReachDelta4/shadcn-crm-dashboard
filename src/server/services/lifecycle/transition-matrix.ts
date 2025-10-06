export type LeadStatus = 
	| 'new'
	| 'contacted'
	| 'qualified'
	| 'disqualified'
	| 'converted'

const ORDER: LeadStatus[] = [
	'new',
	'contacted',
	'qualified',
	'disqualified',
	'converted',
]

export function isTransitionAllowed(from: LeadStatus, to: LeadStatus): boolean {
    if (from === to) return false
    // Strict forward movement only, except admin override (handled at API level)
    const iFrom = ORDER.indexOf(from)
    const iTo = ORDER.indexOf(to)
    return iTo >= iFrom
}

export function validateStatus(status: string): status is LeadStatus {
	const validStatuses: LeadStatus[] = ORDER
	return validStatuses.includes(status as LeadStatus)
}
