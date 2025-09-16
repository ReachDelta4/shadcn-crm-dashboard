"use client";

import React from "react";

export type StageOverviewItem = { stage: string; handled?: "yes" | "no"; note?: string };

export function StageOverviewListSection({ items }: { items?: StageOverviewItem[] }) {
	const data = items || [];
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No stage summary yet.</div>;
	return (
		<div className="space-y-1.5" data-component="stage-overview-list">
			{data.map((s, i) => (
				<div key={i} className="flex items-start justify-between gap-2 rounded-md border p-2">
					<div className="text-sm"><span className="font-medium">{s.stage}</span>{s.note ? ` — ${s.note}` : ""}</div>
					<span className={`px-2 py-0.5 rounded text-xs ${s.handled === "yes" ? "bg-emerald-500/15 text-emerald-700" : "bg-red-500/15 text-red-700"}`}>{(s.handled || "no").toUpperCase()}</span>
				</div>
			))}
		</div>
	);
}
