import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface LeadStatusTransition {
	id: string
	lead_id: string
	subject_id: string | null
	actor_id: string
	event_type: string
	status_from: string | null
	status_to: string
	override_flag: boolean
	override_reason: string | null
	idempotency_key: string | null
	metadata: Record<string, any> | null
	created_at: string
}

export interface CreateTransitionInput {
	lead_id: string
	subject_id?: string | null
	actor_id: string
	event_type?: string
	status_from: string | null
	status_to: string
	override_flag?: boolean
	override_reason?: string | null
	idempotency_key?: string | null
	metadata?: Record<string, any> | null
}

export class LeadStatusTransitionsRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	async create(input: CreateTransitionInput): Promise<LeadStatusTransition> {
		const { data, error } = await this.client
			.from('lead_status_transitions')
			.insert({
				lead_id: input.lead_id,
				subject_id: input.subject_id || null,
				actor_id: input.actor_id,
				event_type: input.event_type || 'status_change',
				status_from: input.status_from,
				status_to: input.status_to,
				override_flag: input.override_flag || false,
				override_reason: input.override_reason || null,
				idempotency_key: input.idempotency_key || null,
				metadata: input.metadata || null,
			})
			.select()
			.single()

		if (error) {
			// Check for idempotency key conflict
			if (error.code === '23505' && error.message?.includes('idempotency')) {
				// Fetch existing transition with this key
				const { data: existing } = await this.client
					.from('lead_status_transitions')
					.select('*')
					.eq('idempotency_key', input.idempotency_key!)
					.single()
				
				if (existing) return existing as LeadStatusTransition
			}
			throw new Error(`Failed to create transition: ${error.message}`)
		}

		return data as LeadStatusTransition
	}

	async findByLeadId(leadId: string, limit = 100): Promise<LeadStatusTransition[]> {
		const { data, error } = await this.client
			.from('lead_status_transitions')
			.select('*')
			.eq('lead_id', leadId)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (error) throw new Error(`Failed to fetch transitions: ${error.message}`)
		return (data || []) as LeadStatusTransition[]
	}

	async findBySubjectId(subjectId: string, limit = 100): Promise<LeadStatusTransition[]> {
		const { data, error } = await this.client
			.from('lead_status_transitions')
			.select('*')
			.eq('subject_id', subjectId)
			.order('created_at', { ascending: false })
			.limit(limit)

		if (error) throw new Error(`Failed to fetch transitions: ${error.message}`)
		return (data || []) as LeadStatusTransition[]
	}
}
