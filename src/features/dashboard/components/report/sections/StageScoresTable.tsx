"use client";

import React from "react";
type Row = { stage: string; score: number; weightPct: number; weighted: number; rationale?: string };
type Props = { rows?: Row[]; totalWeighted?: number; totalPct?: number };
export function StageScoresTable({ rows, totalWeighted, totalPct }: Props) {
	const data = rows || [];
	if (data.length === 0)
		return <div className="text-sm italic text-muted-foreground">No stage scores yet.</div>;
	return (
		<div className="overflow-auto">
			<table className="w-full text-[13px]">
				<thead>
					<tr className="text-left border-b bg-muted/30">
						<th className="py-2 pr-2 font-medium">Stage</th>
						<th className="py-2 pr-2 font-medium text-right">Score</th>
						<th className="py-2 pr-2 font-medium text-right">Weight</th>
						<th className="py-2 pr-2 font-medium text-right">Weighted</th>
						<th className="py-2 pr-2 font-medium">Rationale</th>
					</tr>
				</thead>
				<tbody>
					{data.map((r, i) => (
						<tr key={i} className={"border-b last:border-0 " + (i % 2 === 1 ? "bg-muted/10" : "") }>
							<td className="py-2 pr-2 whitespace-nowrap">{r.stage}</td>
							<td className="py-2 pr-2 text-right tabular-nums">{r.score}</td>
							<td className="py-2 pr-2 text-right tabular-nums">{r.weightPct}%</td>
							<td className="py-2 pr-2 text-right tabular-nums">{r.weighted}</td>
							<td className="py-2 pr-2">{r.rationale || ""}</td>
						</tr>
					))}
				</tbody>
				{(totalWeighted != null || totalPct != null) && (
					<tfoot>
						<tr className="border-t bg-muted/30">
							<td className="py-2 pr-2 font-medium">TOTAL</td>
							<td></td>
							<td className="py-2 pr-2 text-right tabular-nums">{totalPct != null ? `${totalPct}%` : ""}</td>
							<td className="py-2 pr-2 font-medium text-right tabular-nums">{totalWeighted != null ? totalWeighted : ""}</td>
							<td></td>
						</tr>
					</tfoot>
				)}
			</table>
		</div>
	);
}
