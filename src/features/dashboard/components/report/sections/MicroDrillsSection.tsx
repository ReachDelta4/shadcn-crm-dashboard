"use client";

import React from "react";

type Drill = { title: string; steps?: string[] };

type Props = { drills?: Drill[] };

export function MicroDrillsSection({ drills }: Props) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{(drills || []).map((d, i) => (
				<div key={i} className="rounded-md border p-3">
					<div className="text-sm font-medium mb-1">{d.title}</div>
					<ol className="list-decimal pl-5 text-sm space-y-1">
						{(d.steps || []).map((s, j) => (<li key={j}>{s}</li>))}
					</ol>
				</div>
			))}
		</div>
	);
}


