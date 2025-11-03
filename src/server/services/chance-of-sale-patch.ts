import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { SessionsRepository } from '@/server/repositories/sessions'
import { TranscriptsRepository } from '@/server/repositories/transcripts'
import { indexReportMarkdown } from '@/server/services/markdown-indexer'
import { chatWithTools, ToolDefinition, ChatMessage, ChatToolHandlerResult } from '@/server/services/openrouter'

export type CosSectionId =
  | 'COS/DEAL_HEALTH'
  | 'COS/MEDDICC'
  | 'COS/BANT'
  | 'COS/DEAL_SCORE'
  | 'COS/PROBABILITY'
  | 'COS/BOOSTERS_BLOCKERS'
  | 'COS/NEXT_STEPS'

export type CosPatchOp =
  | { op: 'replace_section'; path: CosSectionId; content_md: string }
  | { op: 'upsert_section'; path: CosSectionId; content_md: string }
  | { op: 'remove_section'; path: CosSectionId }

export interface CosPatchOpsPayload { operations: CosPatchOp[] }

const COS_TAB_START = '<!-- TAB: CHANCE OF SALE -->'
const COS_TAB_END = '<!-- /TAB: CHANCE OF SALE -->'

function ensureTabEnvelope(cosContent: string): string {
  const body = cosContent.trim()
  if (body.includes(COS_TAB_START) && body.includes(COS_TAB_END)) return body
  return [COS_TAB_START, body, COS_TAB_END].join('\n')
}

function sectionStart(id: CosSectionId): string { return `<!-- SECTION: ${id} -->` }
function sectionEnd(id: CosSectionId): string { return `<!-- /SECTION: ${id} -->` }

const SECTION_ORDER: CosSectionId[] = [
  'COS/DEAL_HEALTH',
  'COS/MEDDICC',
  'COS/BANT',
  'COS/DEAL_SCORE',
  'COS/PROBABILITY',
  'COS/BOOSTERS_BLOCKERS',
  'COS/NEXT_STEPS',
]

function insertAt(array: string[], index: number, value: string) {
  array.splice(index, 0, value)
}

function getCosSegment(combinedMarkdown?: string | null): { cos: string; start: number; end: number } | null {
  if (!combinedMarkdown) return null
  const s = combinedMarkdown.indexOf(COS_TAB_START)
  const e = combinedMarkdown.indexOf(COS_TAB_END)
  if (s === -1 || e === -1 || e <= s) return null
  const endIdx = e + COS_TAB_END.length
  return { cos: combinedMarkdown.slice(s, endIdx), start: s, end: endIdx }
}

function applySingleOpToCos(cosSegment: string, op: CosPatchOp): string {
  const lines = cosSegment.split('\n')
  const sMarker = sectionStart(op.path)
  const eMarker = sectionEnd(op.path)
  let sIdx = -1
  let eIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(sMarker)) sIdx = i
    if (lines[i].includes(eMarker)) { eIdx = i; if (sIdx !== -1) break }
  }

  // Helper: fallback to heading-based replace when markers missing
  function headingFallbackReplace(contentMd: string): string {
    // Expect a second-level heading `##` within content; try to find same heading
    const m = /^\s*##\s+(.+)$/m.exec(contentMd)
    if (!m) return cosSegment // cannot fallback without a heading
    const heading = m[1].trim()
    const all = cosSegment
    const idx = all.indexOf(`## ${heading}`)
    if (idx === -1) return cosSegment
    // replace from heading to next `\n## ` or TAB_END
    const after = all.slice(idx)
    const nextRel = after.indexOf('\n## ')
    const nextTab = after.indexOf(COS_TAB_END)
    let replaceEnd = -1
    if (nextRel > 0) replaceEnd = idx + nextRel
    else if (nextTab > 0) replaceEnd = idx + nextTab
    else replaceEnd = all.length
    return all.slice(0, idx) + contentMd + all.slice(replaceEnd)
  }

  switch (op.op) {
    case 'remove_section': {
      if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
        const before = lines.slice(0, sIdx)
        const after = lines.slice(eIdx + 1)
        return [...before, ...after].join('\n')
      }
      // If no markers, nothing to remove
      return cosSegment
    }
    case 'replace_section': {
      if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
        const before = lines.slice(0, sIdx + 1) // include start marker
        const after = lines.slice(eIdx) // include end marker
        const contentLines = op.content_md.replace(/\r\n?/g, '\n').split('\n')
        return [...before, ...contentLines, ...after].join('\n')
      }
      // fallback: heading-based replacement
      return headingFallbackReplace(op.content_md)
    }
    case 'upsert_section': {
      if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
        // Already present; replace content between markers
        const before = lines.slice(0, sIdx + 1)
        const after = lines.slice(eIdx)
        const contentLines = op.content_md.replace(/\r\n?/g, '\n').split('\n')
        return [...before, ...contentLines, ...after].join('\n')
      }
      // Insert a new section at canonical position (by SECTION_ORDER)
      const insertionId = op.path
      const orderIndex = SECTION_ORDER.indexOf(insertionId)
      // Find next existing section after desired index to insert before
      let insertLine = lines.length - 1 // before TAB_END
      for (let i = orderIndex + 1; i < SECTION_ORDER.length; i++) {
        const nextS = sectionStart(SECTION_ORDER[i])
        const nextIdx = lines.findIndex(l => l.includes(nextS))
        if (nextIdx !== -1) { insertLine = nextIdx; break }
      }
      const newBlock = [
        sMarker,
        ...op.content_md.replace(/\r\n?/g, '\n').split('\n'),
        eMarker,
      ]
      const out = [...lines]
      insertAt(out, insertLine, newBlock.join('\n'))
      return out.join('\n')
    }
  }
}

function applyPatchOpsToCos(cosSegment: string, ops: CosPatchOp[]): string {
  let out = ensureTabEnvelope(cosSegment)
  for (const op of ops) {
    out = applySingleOpToCos(out, op)
  }
  return out
}

export async function applyCosPatch(
  supabase: any,
  userId: string,
  sessionId: string,
  ops: CosPatchOp[]
): Promise<{ markdown: string }> {
  const reportsRepo = new ReportsV3TabsRepository(supabase)
  const sessionsRepo = new SessionsRepository(supabase)
  const current = await reportsRepo.findBySessionId(sessionId, userId)
  const combinedMd: string = (current?.report as any)?.markdown || ''
  const seg = getCosSegment(combinedMd)
  const cosOnly = seg?.cos || `${COS_TAB_START}\n# Chance of Sale\n\n${COS_TAB_END}`
  const patchedCos = applyPatchOpsToCos(cosOnly, ops)
  let nextCombined = combinedMd
  if (seg) {
    nextCombined = combinedMd.slice(0, seg.start) + patchedCos + combinedMd.slice(seg.end)
  } else {
    nextCombined = [combinedMd.trim(), patchedCos].filter(Boolean).join('\n\n')
  }
  await (supabase as any)
    .from('session_reports_v3_tabs')
    .update({ status: 'ready', report_json: { ...(current?.report || {}), markdown: nextCombined }, last_error: null })
    .eq('session_id', sessionId)
    .then(({ error }: any) => { if (error) throw error })
  try { await indexReportMarkdown(supabase, sessionId, nextCombined) } catch {}

  // Versioning: store patch ops as diff in cos_versions
  try {
    const session = await sessionsRepo.findById(sessionId, userId)
    const subjectId = (session as any)?.subject_id
    if (subjectId) {
      const { data: verRow } = await (supabase as any)
        .from('cos_versions')
        .select('version')
        .eq('subject_id', subjectId)
        .order('version', { ascending: false })
        .limit(1)
      const nextVersion = (verRow?.[0]?.version || 0) + 1
      await (supabase as any)
        .from('cos_versions')
        .insert({
          subject_id: subjectId,
          session_id: sessionId,
          version: nextVersion,
          markdown: patchedCos,
          ops_json: ops,
          reason: 'targeted_patch',
          source: 'patch',
        })
    }
  } catch {}
  return { markdown: nextCombined }
}

export async function generateCosPatchFromModel(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ applied: boolean; operations?: CosPatchOp[]; reason?: string }> {
  const sessionsRepo = new SessionsRepository(supabase)
  const transcriptsRepo = new TranscriptsRepository(supabase)
  const reportsRepo = new ReportsV3TabsRepository(supabase)
  const [session, transcripts, report] = await Promise.all([
    sessionsRepo.findById(sessionId, userId),
    transcriptsRepo.findBySessionId(sessionId, userId),
    reportsRepo.findBySessionId(sessionId, userId),
  ])
  const existing: string | undefined = (report?.report as any)?.markdown
  const messages: ChatMessage[] = [
    { role: 'system', content: [
      'You are an expert sales analyst and technical editor.',
      'Task: Propose targeted patch operations to update ONLY the Chance of Sale tab.',
      'Use strict JSON via function tool only. Do not print raw markdown in assistant messages.',
      'Each section must be a cohesive markdown fragment that can replace the section body.',
      'Sections use invisible anchors: <!-- SECTION: COS/ID -->...<!-- /SECTION: COS/ID -->',
      'Paths allowed: COS/DEAL_HEALTH, COS/MEDDICC, COS/BANT, COS/DEAL_SCORE, COS/PROBABILITY, COS/BOOSTERS_BLOCKERS, COS/NEXT_STEPS.',
      'Prefer replace_section; use upsert_section when missing; remove_section rarely.',
    ].join('\n') },
    { role: 'user', content: [
      `SESSION_ID: ${sessionId}`,
      `SESSION_META: ${JSON.stringify({ id: session?.id, type: session?.type, status: session?.status, started_at: session?.started_at, ended_at: session?.ended_at })}`,
      `EXISTING_MARKDOWN: ${(existing || '').slice(0, 8000)}`,
      `TRANSCRIPTS: ${JSON.stringify(transcripts.slice(-50).map(t => ({ ts: t.timestamp || t.created_at, speaker: t.speaker, text: String(t.content_enc || t.text_enc || '').slice(0, 300) })))}`,
    ].join('\n') }
  ]

  const tools: ToolDefinition[] = [
    {
      type: 'function',
      function: {
        name: 'submit_patch_ops',
        description: 'Submit the final list of patch operations to apply to Chance of Sale.',
        parameters: {
          type: 'object',
          properties: {
            operations: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  op: { type: 'string', enum: ['replace_section','upsert_section','remove_section'] },
                  path: { type: 'string', enum: ['COS/DEAL_HEALTH','COS/MEDDICC','COS/BANT','COS/DEAL_SCORE','COS/PROBABILITY','COS/BOOSTERS_BLOCKERS','COS/NEXT_STEPS'] },
                  content_md: { type: 'string' },
                },
                required: ['op','path'],
                additionalProperties: false,
              }
            },
            reason: { type: 'string' },
          },
          required: ['operations'],
          additionalProperties: false,
        },
      }
    }
  ]

  const state: { ops?: CosPatchOp[]; reason?: string } = {}
  const handlers = {
    submit_patch_ops: async (args: any): Promise<ChatToolHandlerResult> => {
      const ops: CosPatchOp[] = Array.isArray(args?.operations) ? args.operations : []
      state.ops = ops
      state.reason = typeof args?.reason === 'string' ? args.reason : undefined
      return { content: 'received' }
    },
  }

  let lastErr: any = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await chatWithTools({
        model: process.env.OPENROUTER_TOOL_MODEL || process.env.OPENROUTER_MODEL || 'gpt-4o-mini',
        messages,
        tools,
        handlers,
        parallelToolCalls: false,
        maxToolIterations: 1,
        returnOnToolCall: true,
        providerSort: 'quality',
        temperature: 0,
        timeoutMs: 120_000,
      })
      lastErr = null
      break
    } catch (e) {
      lastErr = e
      if (attempt < 2) await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }
  if (lastErr) throw lastErr

  if (!state.ops || state.ops.length === 0) {
    return { applied: false, reason: 'Model did not submit patch operations.' }
  }
  await applyCosPatch(supabase, userId, sessionId, state.ops)
  return { applied: true, operations: state.ops, reason: state.reason }
}
