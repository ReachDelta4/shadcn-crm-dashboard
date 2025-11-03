import { ReportsV3TabsRepository } from '@/server/repositories/reports-v3-tabs'
import { TranscriptsRepository } from '@/server/repositories/transcripts'
import { chatText } from '@/server/services/openrouter'
import { indexReportMarkdown } from '@/server/services/markdown-indexer'
import { SessionsRepository } from '@/server/repositories/sessions'

function buildChanceSystemPrompt(): string {
  return [
    'You are an enterprise sales analyst. Generate ONLY the Chance of Sale tab as Markdown.',
    'Output MUST be wrapped with these exact markers and include section anchors for reliable updates:',
    '<!-- TAB: CHANCE OF SALE -->',
    '# Chance of Sale',
    '',
    '<!-- SECTION: COS/DEAL_HEALTH -->',
    '## Deal Health Pipeline',
    '- Paragraph summary of readiness and engagement, followed by bullets for boosters and blockers context.',
    '<!-- /SECTION: COS/DEAL_HEALTH -->',
    '',
    '<!-- SECTION: COS/MEDDICC -->',
    '## MEDDICC',
    '| Dimension        | Observations | Score (%) |',
    '|------------------|--------------|-----------|',
    '| Metrics          | …            | …         |',
    '| Economic Buyer   | …            | …         |',
    '| Decision Criteria| …            | …         |',
    '| Decision Process | …            | …         |',
    '| Identify Pain    | …            | …         |',
    '| Champion         | …            | …         |',
    '| Competition      | …            | …         |',
    '<!-- /SECTION: COS/MEDDICC -->',
    '',
    '<!-- SECTION: COS/BANT -->',
    '## BANT',
    '| Dimension | Observations | Score (%) |',
    '|----------|--------------|-----------|',
    '| Budget   | …            | …         |',
    '| Authority| …            | …         |',
    '| Need     | …            | …         |',
    '| Timeline | …            | …         |',
    '<!-- /SECTION: COS/BANT -->',
    '',
    '<!-- SECTION: COS/DEAL_SCORE -->',
    '## Deal Score Calculation',
    'Deal Score = (0.25*Metrics + 0.15*EconomicBuyer + 0.10*DecisionCriteria + 0.10*DecisionProcess + 0.15*IdentifyPain + 0.10*Champion + 0.05*Competition + 0.05*Authority)',
    '<!-- /SECTION: COS/DEAL_SCORE -->',
    '',
    '<!-- SECTION: COS/PROBABILITY -->',
    '## Probability of Sale',
    'Provide a short paragraph with the % estimate and risks.',
    '<!-- /SECTION: COS/PROBABILITY -->',
    '',
    '<!-- SECTION: COS/BOOSTERS_BLOCKERS -->',
    '## Boosters vs Blockers',
    '- Separate bullets for positive vs negative influences.',
    '<!-- /SECTION: COS/BOOSTERS_BLOCKERS -->',
    '',
    '<!-- SECTION: COS/NEXT_STEPS -->',
    '## Next Steps to Close',
    '- 3–5 bullets with owner, deadline, micro-scripts.',
    '<!-- /SECTION: COS/NEXT_STEPS -->',
    '',
    '<!-- /TAB: CHANCE OF SALE -->',
    '',
    'Do NOT include Executive Summary or Sales Rep Performance tabs.',
  ].join('\n')
}

function assembleChanceUserPrompt(session: any, transcripts: any[]): string {
  const parts: string[] = []
  parts.push(`# SESSION\nID: ${session?.id}\nType: ${session?.type || session?.session_type || ''}\nStartedAt: ${session?.started_at || ''}`)
  const segments = transcripts.map(t => ({ ts: t.timestamp, speaker: t.speaker, text: t.content_enc }))
  parts.push(`# TRANSCRIPTS\n${JSON.stringify(segments)}`)
  return parts.join('\n\n')
}

export async function generateChanceOfSaleReport(
  supabase: any,
  userId: string,
  sessionId: string
): Promise<{ markdown: string }> {
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

  const system = buildChanceSystemPrompt()
  const user = assembleChanceUserPrompt(session, transcripts)
  const model = (process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b:free')

  let jsonText: { content: string } | null = null
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
      jsonText = { content: (r.content || '').trim() }
      break
    } catch (e) {
      if (attempt < 2) await new Promise(r => setTimeout(r, attempt * 1000))
      else throw e
    }
  }
  const cosMd = jsonText?.content || ''
  if (!cosMd) throw new Error('Empty chance-of-sale markdown')

  const current = await repo.findBySessionId(sessionId, userId)
  const existingMd: string | undefined = (current?.report as any)?.markdown

  let combined = cosMd
  if (existingMd) {
    // If summary exists, preserve it at the front
    const execStart = existingMd.indexOf('<!-- TAB: EXECUTIVE SUMMARY -->')
    const execEnd = existingMd.indexOf('<!-- /TAB: EXECUTIVE SUMMARY -->')
    if (execStart >= 0 && execEnd > execStart) {
      const execPart = existingMd.slice(execStart, execEnd + '<!-- /TAB: EXECUTIVE SUMMARY -->'.length)
      combined = [execPart.trim(), '', cosMd].join('\n\n')
    }
  }

  await (supabase as any)
    .from('session_reports_v3_tabs')
    .update({ status: 'ready', report_json: { ...(current?.report || {}), markdown: combined }, last_error: null })
    .eq('session_id', sessionId)
    .then(({ error }: any) => { if (error) throw error })

  try { await indexReportMarkdown(supabase, sessionId, combined); console.info('[cos] saved combined markdown', { combined_len: combined.length }) } catch {}

  // Versioning record for full regeneration
  try {
    const subjectId = (session as any)?.subject_id
    if (subjectId) {
      const cosStart = combined.indexOf('<!-- TAB: CHANCE OF SALE -->')
      const cosEnd = combined.indexOf('<!-- /TAB: CHANCE OF SALE -->')
      const cosMdOnly = cosStart >= 0 && cosEnd > cosStart ? combined.slice(cosStart, cosEnd + '<!-- /TAB: CHANCE OF SALE -->'.length) : combined
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
          markdown: cosMdOnly,
          ops_json: null,
          reason: 'full_generation',
          source: 'full',
        })
    }
  } catch {}

  return { markdown: combined }
}
