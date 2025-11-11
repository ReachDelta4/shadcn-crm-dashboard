import { useCallback, useEffect, useState } from 'react'

export type ReportKind = 'tabs' | 'v3'

export interface ReportSectionItem {
  slug_path: string
  title: string
  level: number
  content_markdown: string
  start_line: number
  end_line: number
}

interface UseSectionsOptions {
  reportKind?: ReportKind
  prefix?: string
  depth?: number
  limit?: number
  offset?: number
}

export function useReportSections(sessionId?: string, opts: UseSectionsOptions = {}) {
  const [items, setItems] = useState<ReportSectionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOnce = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams()
      p.set('report_kind', (opts.reportKind || 'tabs'))
      if (opts.prefix) p.set('prefix', opts.prefix)
      if (opts.depth != null) p.set('depth', String(opts.depth))
      if (opts.limit != null) p.set('limit', String(opts.limit))
      if (opts.offset != null) p.set('offset', String(opts.offset))
      const res = await fetch(`/api/sessions/${sessionId}/sections?${p.toString()}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setItems(json.items || [])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [sessionId, opts.reportKind, opts.prefix, opts.depth, opts.limit, opts.offset])

  useEffect(() => { fetchOnce() }, [fetchOnce])

  return { items, loading, error, refetch: fetchOnce }
}

