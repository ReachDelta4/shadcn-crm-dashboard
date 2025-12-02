import { generateSummaryReport } from '@/server/services/summary-report'

export async function invokeSummaryGeneration(
  supabase: any,
  userId: string,
  sessionId: string,
  opts: { generator?: typeof generateSummaryReport } = {}
): Promise<{ ok: boolean; error?: string }> {
  const run = opts.generator || generateSummaryReport
  try {
    await run(supabase, userId, sessionId)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[summary] generation error', { sessionId, userId, message })
    return { ok: false, error: message }
  }
}
