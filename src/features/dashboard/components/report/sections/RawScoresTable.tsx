"use client";

import React from "react";

type Row = { dimension: string; score: number; notes?: string };

type Props = { rows?: Row[] };

export function RawScoresTable({ rows }: Props) {
	return (
		<div className="overflow-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="text-left border-b">
						<th className="py-2 pr-2">Dimension</th>
						<th className="py-2 pr-2">Score</th>
						<th className="py-2 pr-2">Notes</th>
					</tr>
				</thead>
				<tbody>
					{(rows || []).map((r, i) => (
						<tr key={i} className="border-b last:border-0">
							<td className="py-2 pr-2 whitespace-nowrap">{r.dimension}</td>
							<td className="py-2 pr-2">{r.score}</td>
							<td className="py-2 pr-2">{r.notes || ""}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}


