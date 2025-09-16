"use client";

import React from "react";

type Row = { metric: string; target?: string | number; current?: string | number; owner?: string };

type Props = { rows?: Row[] };

export function MetricsTableSection({ rows }: Props) {
	return (
		<div className="overflow-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="text-left border-b">
						<th className="py-2 pr-2">Metric</th>
						<th className="py-2 pr-2">Target</th>
						<th className="py-2 pr-2">Current</th>
						<th className="py-2 pr-2">Owner</th>
					</tr>
				</thead>
				<tbody>
					{(rows || []).map((r, i) => (
						<tr key={i} className="border-b last:border-0">
							<td className="py-2 pr-2 whitespace-nowrap">{r.metric}</td>
							<td className="py-2 pr-2">{r.target ?? "-"}</td>
							<td className="py-2 pr-2">{r.current ?? "-"}</td>
							<td className="py-2 pr-2">{r.owner ?? ""}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}


