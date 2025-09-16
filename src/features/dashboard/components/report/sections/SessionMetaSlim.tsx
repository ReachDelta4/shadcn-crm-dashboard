"use client";

import React from "react";

export type SessionMetaFull = {
	date?: string;
	time?: string;
	duration?: string;
	rep?: { name?: string; role?: string; team?: string };
	prospect?: { name?: string; role?: string; company?: string };
	channel?: "phone" | "video" | "in-person" | string;
	transcriptQuality?: string;
};

export function SessionMetaSlim({ date, time, duration, rep, prospect, channel, transcriptQuality }: SessionMetaFull) {
	const items = [
		{ label: "Date", value: date },
		{ label: "Time", value: time },
		{ label: "Duration", value: duration },
		{ label: "Rep", value: rep?.name ? `${rep.name}${rep.role ? `, ${rep.role}` : ""}${rep.team ? ` (${rep.team})` : ""}` : undefined },
		{ label: "Prospect", value: prospect?.name ? `${prospect.name}${prospect.role ? `, ${prospect.role}` : ""}${prospect.company ? ` — ${prospect.company}` : ""}` : undefined },
		{ label: "Channel", value: channel },
		{ label: "Transcript", value: transcriptQuality },
	];
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" data-component="session-meta-slim">
			{items.map((it, i) => (
				<div key={i} className="rounded-md border p-2">
					<div className="text-[11px] uppercase tracking-wide text-muted-foreground">{it.label}</div>
					<div className="text-sm font-medium mt-0.5">{it.value || "-"}</div>
				</div>
			))}
		</div>
	);
}
