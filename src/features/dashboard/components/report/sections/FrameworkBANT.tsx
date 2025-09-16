"use client";

import React from "react";

type Row = { key: string; status?: string; notes?: string };

type Props = {
	rows?: Row[];
};

export function FrameworkBANT({ rows }: Props) {
	const data = rows || [];
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No BANT data.</div>;
	return (
		<div className="overflow-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="text-left border-b bg-muted/30">
						<th className="py-2 pr-2">Field</th>
						<th className="py-2 pr-2">Status</th>
						<th className="py-2 pr-2">Notes</th>
					</tr>
				</thead>
				<tbody>
					{data.map((r, i) => (
						<tr key={i} className="border-b last:border-0">
							<td className="py-2 pr-2 whitespace-nowrap">{r.key}</td>
							<td className="py-2 pr-2">{r.status || "-"}</td>
							<td className="py-2 pr-2">{r.notes || ""}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}


