export const LEAD_SOURCES = [
  { value: 'web_form', label: 'Web Form' },
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'referral', label: 'Referral' },
  { value: 'email', label: 'Email' },
  { value: 'event', label: 'Event' },
  { value: 'other', label: 'Other' },
] as const

export type LeadSourceValue = (typeof LEAD_SOURCES)[number]['value']

export const leadSourceValues = LEAD_SOURCES.map(s => s.value) as readonly LeadSourceValue[]

