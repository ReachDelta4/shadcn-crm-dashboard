import { useEffect, useState, useRef, useCallback } from 'react'
import type { ReportDataV3 } from '../types.v3'

export type ReportStatus = 'idle' | 'queued' | 'running' | 'done' | 'error'

export function useReportV3(sessionId?: string) {
	const [data, setData] = useState<ReportDataV3 | null>(null)
	const [loading, setLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [status, setStatus] = useState<ReportStatus>('idle')
	const [refreshNonce, setRefreshNonce] = useState<number>(0)
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	const clearTimer = () => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current)
			timeoutRef.current = null
		}
	}

	const schedule = (fn: () => void, ms: number) => {
		clearTimer()
		timeoutRef.current = setTimeout(fn, ms)
	}

	const pollOnce = useCallback(async () => {
		if (!sessionId) return
		setLoading(true)
		setStatus(s => (s === 'idle' ? 'running' : s))
		setError(null)
		try {
			const res = await fetch(`/api/sessions/${sessionId}/report-v3`)
			if (res.status === 404) {
				// Kick off generation
				try { await fetch(`/api/sessions/${sessionId}/report-v3`, { method: 'POST' }) } catch {}
				setStatus('queued')
				schedule(pollOnce, 3000)
				return
			}
			if (!res.ok) throw new Error('Failed to fetch report')
			const json = await res.json()
			setData(json?.report || null)
			setStatus('done')
		} catch (e) {
			setError((e as Error).message)
			setStatus('error')
			// Continue polling with backoff
			schedule(pollOnce, 5000)
			return
		} finally {
			setLoading(false)
		}
	}, [sessionId])

	useEffect(() => {
		setData(null)
		setError(null)
		setStatus('idle')
		clearTimer()
		if (!sessionId) return
		pollOnce()
		return () => {
			clearTimer()
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sessionId, refreshNonce])

	const retry = useCallback(() => {
		setRefreshNonce(n => n + 1)
	}, [])

	return { data, loading, error, status, retry }
}
