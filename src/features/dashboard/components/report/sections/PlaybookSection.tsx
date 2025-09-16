"use client";

import React from "react";

type Group = { title: string; bullets?: string[] };

type Props = { groups?: Group[] };

export function PlaybookSection({ groups }: Props) {
	return (
		<div className="space-y-3">
			{(groups || []).map((g, i) => (
				<div key={i} className="rounded-md border p-3">
					<div className="text-sm font-medium mb-1">{g.title}</div>
					<ul className="list-disc pl-5 text-sm space-y-1">
						{(g.bullets || []).map((b, j) => (<li key={j}>{b}</li>))}
					</ul>
				</div>
			))}
		</div>
	);
}


