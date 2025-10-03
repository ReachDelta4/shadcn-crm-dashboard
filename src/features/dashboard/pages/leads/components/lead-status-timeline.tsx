"use client";

import { useEffect, useState } from "react";

export function LeadStatusTimeline({ leadId }: { leadId: string }) {
	const [items, setItems] = useState<Array<{ at: string; from?: string|null; to: string; by?: string }>>([])
	useEffect(() => {
		let canceled = false
		async function load() {
			try {
				const res = await fetch(`/api/leads/${leadId}/transitions`)
				if (!res.ok) return
				const data = await res.json()
				if (!canceled) setItems(data?.transitions || [])
			} catch {}
		}
		load()
		return () => { canceled = true }
	}, [leadId])
	if (items.length === 0) return <div className="text-sm text-muted-foreground">No transitions yet.</div>
	return (
		<ol className="relative border-s pl-4">
			{items.map((it, idx) => (
				<li key={idx} className="mb-4 ms-4">
					<div className="absolute w-3 h-3 bg-primary rounded-full mt-1.5 -start-1.5 border border-white" />
					<time className="mb-1 text-xs font-normal text-muted-foreground">{new Date(it.at).toLocaleString()}</time>
					<div className="text-sm">{it.from ? `${it.from} → ${it.to}` : it.to}</div>
				</li>
			))}
		</ol>
	)
}


