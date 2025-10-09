import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface LeadAppointment {
	id: string
	lead_id: string
	subject_id: string | null
	provider: 'google' | 'outlook' | 'ics' | 'none'
	status: 'scheduled' | 'cancelled' | 'completed'
	start_at_utc: string
	end_at_utc: string
	timezone: string
	provider_event_id: string | null
	meeting_link: string | null
	notes: any | null
	call_outcome?: 'taken' | 'missed' | null
	call_verified_session_id?: string | null
	created_at: string
	updated_at: string
}

export interface CreateAppointmentInput {
	lead_id: string
	subject_id?: string | null
	start_at_utc: string
	end_at_utc: string
	timezone: string
	provider?: 'google' | 'outlook' | 'ics' | 'none'
	meeting_link?: string | null
	notes?: any | null
}

export interface UpdateAppointmentInput {
	status?: 'scheduled' | 'cancelled' | 'completed'
	start_at_utc?: string
	end_at_utc?: string
	timezone?: string
	meeting_link?: string | null
	notes?: any | null
	provider_event_id?: string | null
	call_outcome?: 'taken' | 'missed'
}

export class LeadAppointmentsRepository {
	private client: SupabaseClientAny

	constructor(client?: SupabaseClientAny) {
		this.client = client || defaultClient
	}

	async create(input: CreateAppointmentInput): Promise<LeadAppointment> {
		const { data, error } = await this.client
			.from('lead_appointments')
			.insert({
				lead_id: input.lead_id,
				subject_id: input.subject_id || null,
				provider: input.provider || 'none',
				status: 'scheduled',
				start_at_utc: input.start_at_utc,
				end_at_utc: input.end_at_utc,
				timezone: input.timezone,
				meeting_link: input.meeting_link || null,
				notes: input.notes || null,
			})
			.select()
			.single()
		if (error) throw new Error(`Failed to create appointment: ${error.message}`)
		return data as LeadAppointment
	}

	async findByLeadId(leadId: string): Promise<LeadAppointment[]> {
		const { data, error } = await this.client
			.from('lead_appointments')
			.select('*')
			.eq('lead_id', leadId)
			.order('start_at_utc', { ascending: true })
		if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
		return (data || []) as LeadAppointment[]
	}

	async findUpcomingBySubjectId(subjectId: string, nowIso: string, limit = 5, ownerId?: string): Promise<LeadAppointment[]> {
		let query = this.client
			.from('lead_appointments')
			.select('*, leads!inner(owner_id)')
			.eq('subject_id', subjectId)
			.eq('status', 'scheduled')
			.gte('start_at_utc', nowIso)
			.order('start_at_utc', { ascending: true })
			.limit(limit)
		if (ownerId) {
			query = (query as any).eq('leads.owner_id', ownerId)
		}
		const { data, error } = await query
		if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
		return (data || []) as LeadAppointment[]
	}

	async update(id: string, updates: UpdateAppointmentInput): Promise<LeadAppointment> {
		const { data, error } = await this.client
			.from('lead_appointments')
			.update(updates)
			.eq('id', id)
			.select()
			.single()
		if (error) throw new Error(`Failed to update appointment: ${error.message}`)
		return data as LeadAppointment
	}

	async delete(id: string): Promise<void> {
		const { error } = await this.client
			.from('lead_appointments')
			.delete()
			.eq('id', id)
		if (error) throw new Error(`Failed to delete appointment: ${error.message}`)
	}

	async listUpcomingBetween(userId: string, fromIso?: string | null, toIso?: string | null, limit = 500): Promise<LeadAppointment[]> {
		let query: any = this.client
			.from('lead_appointments')
			.select('*, leads!inner(owner_id)')
			.eq('leads.owner_id', userId)
			.eq('status', 'scheduled')
			.order('start_at_utc', { ascending: true })
			.limit(limit)
		if (fromIso) query = query.gte('start_at_utc', fromIso)
		if (toIso) query = query.lte('start_at_utc', toIso)
		const { data, error } = await query
		if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
		return (data || []) as LeadAppointment[]
	}
}
