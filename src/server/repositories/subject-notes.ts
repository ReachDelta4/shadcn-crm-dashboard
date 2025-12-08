import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const defaultClient = createClient(supabaseUrl, supabaseAnonKey)

type SupabaseClientAny = typeof defaultClient

export interface SubjectNote {
  id: string
  subject_id: string
  owner_id: string
  org_id: string | null
  content: string
  metadata: Record<string, any> | null
  created_at: string
  updated_at: string
}

export interface SubjectNoteCreateInput {
  subject_id: string
  owner_id: string
  org_id?: string | null
  content: string
  metadata?: Record<string, any> | null
}

export interface SubjectNoteUpdateInput {
  content?: string
  metadata?: Record<string, any> | null
}

export class SubjectNotesRepository {
  private client: SupabaseClientAny

  constructor(client?: SupabaseClientAny) {
    this.client = client || defaultClient
  }

  setClient(client: SupabaseClientAny) {
    this.client = client
  }

  async listBySubject(subjectId: string, ownerId: string): Promise<SubjectNote[]> {
    const { data, error } = await this.client
      .from('crm_notes')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(`Failed to fetch notes: ${error.message}`)
    return (data || []) as SubjectNote[]
  }

  async create(input: SubjectNoteCreateInput): Promise<SubjectNote> {
    const { data, error } = await this.client
      .from('crm_notes')
      .insert({
        subject_id: input.subject_id,
        owner_id: input.owner_id,
        org_id: input.org_id ?? null,
        content: input.content,
        metadata: input.metadata ?? {},
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create note: ${error.message}`)
    return data as SubjectNote
  }

  async update(id: string, ownerId: string, patch: SubjectNoteUpdateInput): Promise<SubjectNote> {
    const { data, error } = await this.client
      .from('crm_notes')
      .update({
        ...(patch.content !== undefined ? { content: patch.content } : {}),
        ...(patch.metadata !== undefined ? { metadata: patch.metadata ?? {} } : {}),
      })
      .eq('id', id)
      .eq('owner_id', ownerId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update note: ${error.message}`)
    return data as SubjectNote
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const { error } = await this.client
      .from('crm_notes')
      .delete()
      .eq('id', id)
      .eq('owner_id', ownerId)

    if (error) throw new Error(`Failed to delete note: ${error.message}`)
  }
}

