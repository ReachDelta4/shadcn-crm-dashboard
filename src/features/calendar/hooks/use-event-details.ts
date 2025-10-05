"use client";

import { useEffect, useMemo, useState } from "react";

export interface LeadBasics {
	id: string;
	full_name?: string;
	email?: string;
	phone?: string;
	company?: string;
	status?: string;
}

export interface TransitionItem { at: string; from?: string|null; to: string; by?: string }

export interface SubjectSessionItem { id: string; title?: string; status?: string; started_at?: string; ended_at?: string; duration?: number }

export function useEventDetails(leadId?: string|null, subjectId?: string|null) {
	const [lead, setLead] = useState<LeadBasics | null>(null)
	const [transitions, setTransitions] = useState<TransitionItem[]>([])
	const [recentSession, setRecentSession] = useState<SubjectSessionItem | null>(null)
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		let canceled = false
		async function run() {
			if (!leadId && !subjectId) return
			setLoading(true)
			try {
				const tasks: Promise<any>[] = []
				if (leadId) {
					tasks.push(fetch(`/api/leads/${leadId}`).then(r => r.ok ? r.json() : null))
					tasks.push(fetch(`/api/leads/${leadId}/transitions`).then(r => r.ok ? r.json() : null))
				}
				if (subjectId) {
					tasks.push(fetch(`/api/subjects/${subjectId}/sessions?page=1&pageSize=5`).then(r => r.ok ? r.json() : null))
				}
				const results = await Promise.allSettled(tasks)
				if (canceled) return
				for (const res of results) {
					if (res.status !== 'fulfilled' || !res.value) continue
					if (res.value?.data?.id || res.value?.id) {
						setLead({
							id: res.value?.data?.id || res.value?.id,
							full_name: res.value?.data?.full_name || res.value?.full_name,
							email: res.value?.data?.email || res.value?.email,
							phone: res.value?.data?.phone || res.value?.phone,
							company: res.value?.data?.company || res.value?.company,
							status: res.value?.data?.status || res.value?.status,
						})
					}
					if (Array.isArray(res.value?.transitions)) {
						setTransitions(res.value.transitions.slice(0, 5))
					}
					if (Array.isArray(res.value?.sessions)) {
						const s = res.value.sessions[0]
						if (s) setRecentSession({ id: s.id, title: s.title, status: s.status, started_at: s.started_at, ended_at: s.ended_at, duration: s.duration })
					}
				}
			} finally {
				setLoading(false)
			}
		}
		run()
		return () => { canceled = true }
	}, [leadId, subjectId])

	return useMemo(() => ({ lead, transitions, recentSession, loading }), [lead, transitions, recentSession, loading])
}
