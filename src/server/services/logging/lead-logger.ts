export type LeadLogOperation =
  | 'single_transition'
  | 'bulk_transition'
  | 'appointment_schedule'
  | 'transitions_fetch'

export interface LeadLogContext {
  operation: LeadLogOperation
  leadId?: string
  userId?: string
  orgId?: string | null
  role?: string
  targetStatus?: string
  currentStatus?: string | null
  source?: string
  [key: string]: any
}

function safeSerialize(payload: unknown): string {
  try {
    return JSON.stringify(payload)
  } catch {
    return '{"unserializable":true}'
  }
}

export function logLeadTransition(ctx: LeadLogContext): void {
  const payload = {
    type: 'lead_transition',
    ...ctx,
  }
  // eslint-disable-next-line no-console
  console.info('[lead]', safeSerialize(payload))
}

export function logLeadError(ctx: LeadLogContext & { error: unknown; code?: string }): void {
  const { error, ...rest } = ctx
  const normalizedError =
    error instanceof Error
      ? { message: error.message, name: error.name }
      : { message: String(error) }

  const payload = {
    type: 'lead_error',
    ...rest,
    error: normalizedError,
  }
  // eslint-disable-next-line no-console
  console.error('[lead]', safeSerialize(payload))
}

