"use client";

import React from "react";
type Quote = { speaker?: string; text: string; timestamp?: string };
export function QuotesSection({ quotes }: { quotes?: Quote[] }) {
	const data = quotes || [];
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No quotes available.</div>;
	return (
		<div className="space-y-2.5">
			{data.map((q, i) => (
				<figure key={i} className="border rounded-md p-3 bg-muted/20">
					<blockquote className="text-[14px] leading-relaxed">“{q.text}”</blockquote>
					<figcaption className="text-xs text-muted-foreground mt-1">
						{q.speaker ? `${q.speaker}` : ""}{q.timestamp ? ` · ${q.timestamp}` : ""}
					</figcaption>
				</figure>
			))}
		</div>
	);
}
