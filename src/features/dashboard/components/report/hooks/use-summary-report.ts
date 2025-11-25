import { useCallback, useEffect, useState } from 'react'

type Status = 'idle' | 'queued' | 'running' | 'done' | 'error'

export function useSummaryReport(sessionId?: string) {
  const [markdown, setMarkdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')

  const [ensured, setEnsured] = useState(false)

  const fetchOnce = useCallback(async () => {
    if (!sessionId) return { ok: false }
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/sessions/${sessionId}/summary`)
      if (res.status === 404) {
        setStatus('queued')
        const t = await fetch(`/api/sessions/${sessionId}/summary`, { method: 'POST' })
        if (!t.ok) throw new Error(`Failed to trigger summary: ${t.statusText}`)
        return { triggered: true }
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const json = await res.json()
      if (json?.status === 'failed') {
        const msg = json?.last_error || 'Summary generation failed'
        setError(msg)
        setStatus('error')
        return { ok: false, error: msg }
      }
      if (json?.markdown) {
        setMarkdown(json.markdown)
        setStatus('done')
        return { ok: true }
      }
      // Guard: a 'ready' status with no markdown indicates a stale or incompatible row; stop polling with error.
      if (json?.status === 'ready' && !json?.markdown) {
        const msg = json?.last_error || 'Summary tab is missing in the stored report'
        setError(msg)
        setStatus('error')
        return { ok: false, error: msg }
      }
      if ((json?.status === 'queued' || json?.status === 'running') && !ensured) {
        try { await fetch(`/api/sessions/${sessionId}/summary`, { method: 'POST' }) } catch {}
        setEnsured(true)
      }
      setStatus('queued')
      return { polling: true }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg)
      setStatus('error')
      return { ok: false, error: msg }
    } finally {
      setLoading(false)
    }
  }, [sessionId, ensured])

  const retry = useCallback(() => {
    if (!sessionId) return
    setError(null)
    setStatus('idle')
    fetchOnce()
  }, [sessionId, fetchOnce])

  useEffect(() => {
    if (!sessionId) return
    let active = true
    let timer: any = null
    const poll = async () => {
      const result = await fetchOnce()
      if (!active) return
      if (result.triggered || result.polling) {
        timer = setTimeout(poll, 3000)
      }
    }
    poll()
    return () => { active = false; if (timer) clearTimeout(timer) }
  }, [sessionId, fetchOnce])

  return { markdown, loading, error, status, retry }
}
