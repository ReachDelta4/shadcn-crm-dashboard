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
    // Allow any transition between different statuses.
    return from !== to
}

export function validateStatus(status: string): status is LeadStatus {
	const validStatuses: LeadStatus[] = ORDER
	return validStatuses.includes(status as LeadStatus)
}
