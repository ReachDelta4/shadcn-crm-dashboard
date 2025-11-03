import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { SessionsRepository } from '@/server/repositories/sessions'
import { TranscriptsRepository } from '@/server/repositories/transcripts'
import { chatText } from '@/server/services/openrouter'
import { indexReportMarkdown } from '@/server/services/markdown-indexer'

function buildSummarySystemPrompt(): string {
  return [
    // Preserve your original tone and density requirements, remove unrelated tabs, add stable anchors
    'You are an enterprise sales analyst. Generate ONLY the Executive Summary tab as Markdown.',
    'Output MUST be wrapped with these exact markers and include section anchors for reliable updates:',
    '<!-- TAB: EXECUTIVE SUMMARY -->',
    '# Executive Summary',
    '',
    '<!-- SECTION: EXEC/CALL_OVERVIEW -->',
    '## Call Overview',
    'Write a concise paragraph capturing sequence, tone, flow, rep approach, engagement.',
    '<!-- /SECTION: EXEC/CALL_OVERVIEW -->',
    '',
    '<!-- SECTION: EXEC/PAINS -->',
    '## Pain Points of the Prospect',
    '- Include timestamps and short evidence quotes where relevant.',
    '<!-- /SECTION: EXEC/PAINS -->',
    '',
    '<!-- SECTION: EXEC/OBJECTIONS -->',
    '## Objections Raised',
    '- List with timestamps; reflect how they were handled if applicable.',
    '<!-- /SECTION: EXEC/OBJECTIONS -->',
    '',
    '<!-- SECTION: EXEC/BUYING_SIGNALS -->',
    '## Buying Signals',
    '- Verbal or implied indications of interest.',
    '<!-- /SECTION: EXEC/BUYING_SIGNALS -->',
    '',
    '<!-- SECTION: EXEC/KEY_DETAILS -->',
    '## Key Details to Remember',
    '- Team size, decision makers, priorities, budget, timelines.',
    '<!-- /SECTION: EXEC/KEY_DETAILS -->',
    '',
    '<!-- SECTION: EXEC/MISSED_OPPS -->',
    '## Missed Opportunities',
    '- Areas the rep could have probed further or strengthened the deal.',
    '<!-- /SECTION: EXEC/MISSED_OPPS -->',
    '',
    '<!-- SECTION: EXEC/IMPROVEMENTS -->',
    '## Areas to Improve',
    '- Specific, actionable points for the rep.',
    '<!-- /SECTION: EXEC/IMPROVEMENTS -->',
    '',
    '<!-- SECTION: EXEC/NEXT_STEPS -->',
    '## To-Do List / Next Steps',
    '- Bullets with owner & deadline.',
    '<!-- /SECTION: EXEC/NEXT_STEPS -->',
    '',
    '<!-- /TAB: EXECUTIVE SUMMARY -->',
    '',
    'Do NOT include Chance of Sale or Sales Rep Performance tabs.',
  ].join('\n')
}

function assembleSummaryUserPrompt(session: any, transcripts: any[]): string {
  const parts: string[] = []
  parts.push(`# SESSION\nID: ${session?.id}\nType: ${session?.type || session?.session_type || ''}\nStartedAt: ${session?.started_at || ''}`)
  const segments = transcripts.map(t => ({ ts: t.timestamp, speaker: t.speaker, text: t.content_enc }))
  parts.push(`# TRANSCRIPTS\n${JSON.stringify(segments)}`)
  return parts.join('\n\n')
}

export async function generateSummaryReport(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ markdown: string }> {
  console.info('[summary] generate start', { sessionId })
  const repo = new ReportsV3TabsRepository(supabase)
  const sessionsRepo = new SessionsRepository(supabase)
  const transcriptsRepo = new TranscriptsRepository(supabase)

  const existing = await repo.findBySessionId(sessionId, userId)
  if (!existing) {
    await repo.upsertQueued(sessionId)
  }
  try { await repo.setRunning(sessionId) } catch {}

  const session = await sessionsRepo.findById(sessionId, userId)
  if (!session) throw new Error('Session not found')
  const transcripts = await transcriptsRepo.findBySessionId(sessionId, userId)
  console.info('[summary] inputs', { transcripts: transcripts.length })

  const system = buildSummarySystemPrompt()
  const user = assembleSummaryUserPrompt(session, transcripts)
  const model = (process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b:free')

  let txt: { content: string } | null = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await chatText({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.2,
        maxTokens: 4000,
        timeoutMs: 180_000,
        debug: true,
      })
      txt = { content: (r.content || '').trim() }
      break
    } catch (e) {
      if (attempt < 2) await new Promise(r => setTimeout(r, attempt * 1000))
      else throw e
    }
  }
  const markdown = (txt?.content || '').trim()
  if (!markdown) throw new Error('Empty summary markdown')
  console.info('[summary] LLM ok', { content_len: markdown.length })

  // Merge into report_json { markdown: combinedMarkdown }
  // We keep combined tabs structure: only EXECUTIVE SUMMARY is ensured here.
  const current = await repo.findBySessionId(sessionId, userId)
  const existingMd: string | undefined = (current?.report as any)?.markdown
  let combined = markdown
  if (existingMd && existingMd.includes('<!-- TAB: CHANCE OF SALE -->')) {
    // attempt to preserve existing CoS by stitching sections
    const cosStart = existingMd.indexOf('<!-- TAB: CHANCE OF SALE -->')
    if (cosStart >= 0) {
      const cosPart = existingMd.slice(cosStart)
      combined = [markdown.replace(/\s+$/,'').trim(), '', cosPart].join('\n\n')
    }
  }

  await (supabase as any)
    .from('session_reports_v3_tabs')
    .update({ status: 'ready', report_json: { ...(current?.report || {}), markdown: combined }, last_error: null })
    .eq('session_id', sessionId)
    .then(({ error }: any) => { if (error) throw error })
  console.info('[summary] saved combined markdown', { combined_len: combined.length })

  // Index sections for querying later
  try { await indexReportMarkdown(supabase, sessionId, combined) } catch {}

  return { markdown: combined }
}
