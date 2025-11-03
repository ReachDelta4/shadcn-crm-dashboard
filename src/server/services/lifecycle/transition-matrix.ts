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
    // Only allow forward transitions in the canonical order
    const fromIdx = ORDER.indexOf(from)
    const toIdx = ORDER.indexOf(to)
    if (fromIdx < 0 || toIdx < 0) return false
    return toIdx > fromIdx
}

export function validateStatus(status: string): status is LeadStatus {
	const validStatuses: LeadStatus[] = ORDER
	return validStatuses.includes(status as LeadStatus)
}
