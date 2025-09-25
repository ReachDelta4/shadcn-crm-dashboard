import { useState, useEffect, useCallback } from 'react'
import type { ReportDataV3Tabs } from '@/server/repositories/reports-v3-tabs'

type ReportStatus = 'idle' | 'queued' | 'running' | 'done' | 'error'

interface UseReportV3TabsReturn {
	data: ReportDataV3Tabs | null
	loading: boolean
	error: string | null
	status: ReportStatus
	retry: () => void
}

export function useReportV3Tabs(sessionId?: string): UseReportV3TabsReturn {
	const [data, setData] = useState<ReportDataV3Tabs | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [status, setStatus] = useState<ReportStatus>('idle')

	const fetchTabsReport = useCallback(async (sessionId: string) => {
		try {
			setLoading(true)
			setError(null)
			
			const response = await fetch(`/api/sessions/${sessionId}/report-v3-tabs`)
			
			if (response.status === 404) {
				// No tabs report exists, trigger generation
				setStatus('queued')
				const triggerResponse = await fetch(`/api/sessions/${sessionId}/report-v3-tabs`, {
					method: 'POST'
				})
				
				if (!triggerResponse.ok) {
					throw new Error(`Failed to trigger tabs report generation: ${triggerResponse.statusText}`)
				}
				
				// Start polling after successful trigger
				return { triggered: true }
			}
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}
			
			const result = await response.json()
			
			if (result?.status === 'failed') {
				setStatus('error')
				setError(result?.last_error || 'Report generation failed')
				return { error: result?.last_error || 'failed' }
			}
			
			if (result.report) {
				setData(result.report)
				setStatus('done')
				return { data: result.report }
			} else {
				// Report record exists but no data yet (queued/running)
				setStatus(result.status === 'running' ? 'running' : 'queued')
				return { polling: true }
			}
			
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
			setError(errorMessage)
			setStatus('error')
			console.error('Tabs report fetch error:', err)
			return { error: errorMessage }
		} finally {
			setLoading(false)
		}
	}, [])

	const retry = useCallback(() => {
		if (sessionId) {
			setError(null)
			setStatus('idle')
			fetchTabsReport(sessionId)
		}
	}, [sessionId, fetchTabsReport])

	useEffect(() => {
		if (!sessionId) return

		let timeoutId: NodeJS.Timeout | null = null
		let isActive = true

		const poll = async () => {
			if (!isActive) return

			const result = await fetchTabsReport(sessionId)
			
			if (!isActive) return

			// If we need to keep polling (queued, running, or just triggered)
			if (result.triggered || result.polling) {
				timeoutId = setTimeout(() => {
					if (isActive) poll()
				}, 3000) // Poll every 3 seconds
			}
		}

		poll()

		return () => {
			isActive = false
			if (timeoutId) {
				clearTimeout(timeoutId)
			}
		}
	}, [sessionId, fetchTabsReport])

	return {
		data,
		loading,
		error,
		status,
		retry
	}
}





