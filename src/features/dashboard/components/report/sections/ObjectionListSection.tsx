"use client";

import React from "react";

export type ObjectionItem = { label: string; handled?: "yes" | "no" | "partial" };

export function ObjectionListSection({ items }: { items?: ObjectionItem[] }) {
	const data = items || [];
	const color = (h?: string) => h === "yes" ? "bg-emerald-500/15 text-emerald-700" : h === "partial" ? "bg-amber-500/15 text-amber-700" : "bg-red-500/15 text-red-700";
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No objections recorded.</div>;
	return (
		<div className="space-y-1.5" data-component="objection-list">
			{data.map((it, i) => (
				<div key={i} className="flex items-center justify-between gap-2 rounded-md border p-2" data-item-id={i}>
					<div className="text-sm">{it.label}</div>
					<span className={`px-2 py-0.5 rounded text-xs ${color(it.handled)}`}>{(it.handled || "no").toUpperCase()}</span>
				</div>
			))}
		</div>
	);
}
