import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { SubjectNotesRepository } from '@/server/repositories/subject-notes'
import { getUserAndScope } from '@/server/auth/getUserAndScope'

const updateNoteSchema = z.object({
  content: z.string().min(1, 'Content is required').optional(),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const scope = await getUserAndScope()
    const { noteId } = await params
    const body = await request.json()
    const parsed = updateNoteSchema.parse(body)

    const supabase = await getServerClient()
    const repo = new SubjectNotesRepository(supabase as any)
    const note = await repo.update(noteId, scope.userId, {
      content: parsed.content,
      metadata: parsed.metadata,
    })

    return NextResponse.json(note)
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const scope = await getUserAndScope()
    const { noteId } = await params

    const supabase = await getServerClient()
    const repo = new SubjectNotesRepository(supabase as any)
    await repo.delete(noteId, scope.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error', code: 'internal_error' }, { status: 500 })
  }
}

