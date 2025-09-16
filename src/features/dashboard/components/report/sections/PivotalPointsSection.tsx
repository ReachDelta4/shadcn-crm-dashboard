"use client";

import React from "react";

export type Pivot = { ts: string; reason: string; quote?: string };

export function PivotalPointsSection({ points }: { points?: Pivot[] }) {
	const data = points || [];
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No pivotal points captured.</div>;
	return (
		<div className="space-y-1.5" data-component="pivotal-points">
			{data.map((p, i) => (
				<div key={i} className="rounded-md border p-2">
					<div className="text-sm font-medium">{p.ts}</div>
					<div className="text-sm">{p.reason}</div>
					{p.quote ? <div className="text-xs text-muted-foreground mt-0.5">“{p.quote}”</div> : null}
				</div>
			))}
		</div>
	);
}
