import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SubjectNotesRepository } from '@/server/repositories/subject-notes'
import { getUserAndScope } from '@/server/auth/getUserAndScope'

const createNoteSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  metadata: z.record(z.any()).optional(),
})

async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        },
      },
    },
  )
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scope = await getUserAndScope()
    const { id: subjectId } = await params

    const supabase = await getServerClient()
    const repo = new SubjectNotesRepository(supabase as any)
    const notes = await repo.listBySubject(subjectId, scope.userId)

    return NextResponse.json({ notes })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'validation_failed', details: error.errors },
        { status: 400 },
      )
    }
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error', code: 'internal_error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const scope = await getUserAndScope()
    const { id: subjectId } = await params
    const body = await request.json()
    const parsed = createNoteSchema.parse(body)

    const supabase = await getServerClient()
    const repo = new SubjectNotesRepository(supabase as any)
    const note = await repo.create({
      subject_id: subjectId,
      owner_id: scope.userId,
      org_id: scope.orgId ?? null,
      content: parsed.content,
      metadata: parsed.metadata ?? {},
    })

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'validation_failed', details: error.errors },
        { status: 400 },
      )
    }
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error', code: 'internal_error' }, { status: 500 })
  }
}

