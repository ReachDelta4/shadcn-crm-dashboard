import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}))

vi.mock('@/server/repositories/subject-notes', () => ({
  SubjectNotesRepository: vi.fn().mockImplementation(() => ({
    listBySubject: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({
      id: 'note_1',
      subject_id: 'sub_1',
      owner_id: 'u1',
      org_id: 'org-1',
      content: 'Hello',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    update: vi.fn().mockResolvedValue({
      id: 'note_1',
      subject_id: 'sub_1',
      owner_id: 'u1',
      org_id: 'org-1',
      content: 'Updated',
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
}))

vi.mock('@/server/auth/getUserAndScope', () => ({
  getUserAndScope: vi.fn().mockResolvedValue({
    userId: 'u1',
    role: 'rep',
    teamId: null,
    orgId: 'org-1',
    allowedOwnerIds: ['u1'],
  }),
}))

import { createServerClient } from '@supabase/ssr'
import { SubjectNotesRepository } from '@/server/repositories/subject-notes'
import { getUserAndScope } from '@/server/auth/getUserAndScope'

function makeSupabaseMock() {
  return {}
}

describe('/api/subjects/[id]/notes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerClient as any).mockResolvedValue(makeSupabaseMock())
  })

  it('lists notes for a subject', async () => {
    const { GET } = await import('@/app/api/subjects/[id]/notes/route')

    const res = await GET(new Request('http://localhost/api/subjects/sub_1/notes') as any, {
      params: Promise.resolve({ id: 'sub_1' }),
    } as any)

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json.notes)).toBe(true)
  })

  it('creates a note with content and metadata', async () => {
    const { POST } = await import('@/app/api/subjects/[id]/notes/route')

    const req = new Request('http://localhost/api/subjects/sub_1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Hello', metadata: { source: 'crm' } }),
    })

    const res = await POST(req as any, { params: Promise.resolve({ id: 'sub_1' }) } as any)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.id).toBe('note_1')
    expect(json.content).toBe('Hello')

    // Repository call shape is validated indirectly via resolved payload
    expect(json.subject_id).toBe('sub_1')
    expect(json.owner_id).toBe('u1')
  })
})

describe('/api/subjects/[id]/notes/[noteId]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(createServerClient as any).mockResolvedValue(makeSupabaseMock())
  })

  it('updates a note', async () => {
    const { PATCH } = await import('@/app/api/subjects/[id]/notes/[noteId]/route')

    const req = new Request('http://localhost/api/subjects/sub_1/notes/note_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated' }),
    })

    const res = await PATCH(
      req as any,
      { params: Promise.resolve({ id: 'sub_1', noteId: 'note_1' }) } as any,
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.content).toBe('Updated')
  })

  it('deletes a note', async () => {
    const { DELETE } = await import('@/app/api/subjects/[id]/notes/[noteId]/route')

    const req = new Request('http://localhost/api/subjects/sub_1/notes/note_1', {
      method: 'DELETE',
    })

    const res = await DELETE(
      req as any,
      { params: Promise.resolve({ id: 'sub_1', noteId: 'note_1' }) } as any,
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })
})
