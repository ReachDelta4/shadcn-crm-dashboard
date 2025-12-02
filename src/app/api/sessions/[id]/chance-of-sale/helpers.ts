import { generateChanceOfSaleReport } from '@/server/services/chance-of-sale-report'

export async function invokeChanceOfSaleGeneration(
  supabase: any,
  userId: string,
  sessionId: string,
  opts: { generator?: typeof generateChanceOfSaleReport } = {}
): Promise<{ ok: boolean; error?: string }> {
  const run = opts.generator || generateChanceOfSaleReport
  try {
    await run(supabase, userId, sessionId)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[chance-of-sale] generation error', { sessionId, userId, message })
    return { ok: false, error: message }
  }
}
