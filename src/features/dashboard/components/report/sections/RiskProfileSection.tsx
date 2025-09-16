"use client";

import React from "react";

export type RiskItem = { area: string; severity?: "low" | "medium" | "high"; impact?: "Low" | "Medium" | "High"; likelihood?: "Low" | "Medium" | "High"; rationale?: string };

type Props = { items?: RiskItem[] };

export function RiskProfileSection({ items }: Props) {
	const pill = (sev?: string) => sev === "high" ? "bg-red-500/15 text-red-600" : sev === "medium" ? "bg-amber-500/15 text-amber-600" : "bg-emerald-500/15 text-emerald-600";
	const data = items || [];
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No risks recorded.</div>;
	const showImpact = data.some(r => r.impact);
	const showLikelihood = data.some(r => r.likelihood);
	const showSeverity = data.some(r => r.severity);
	return (
		<div className="overflow-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="text-left border-b bg-muted/30">
						<th className="py-2 pr-2">Area</th>
						{showSeverity ? <th className="py-2 pr-2">Severity</th> : null}
						{showImpact ? <th className="py-2 pr-2">Impact</th> : null}
						{showLikelihood ? <th className="py-2 pr-2">Likelihood</th> : null}
						<th className="py-2 pr-2">Rationale</th>
					</tr>
				</thead>
				<tbody>
					{data.map((r, i) => (
						<tr key={i} className="border-b last:border-0">
							<td className="py-2 pr-2 whitespace-nowrap">{r.area}</td>
							{showSeverity ? <td className="py-2 pr-2">{r.severity ? <span className={`px-2 py-0.5 rounded ${pill(r.severity)}`}>{r.severity}</span> : "-"}</td> : null}
							{showImpact ? <td className="py-2 pr-2">{r.impact || "-"}</td> : null}
							{showLikelihood ? <td className="py-2 pr-2">{r.likelihood || "-"}</td> : null}
							<td className="py-2 pr-2">{r.rationale || ""}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}


