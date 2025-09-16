"use client";

import React from "react";

type Field = { label: string; value?: string | string[] };

type Props = {
	metrics?: Field;
	economicBuyer?: Field;
	decisionCriteria?: Field;
	decisionProcess?: Field;
	identifyPain?: Field;
	champion?: Field;
	competition?: Field;
};

export function FrameworkMEDDICC({ metrics, economicBuyer, decisionCriteria, decisionProcess, identifyPain, champion, competition }: Props) {
	const fields: Field[] = [
		{ label: "Metrics", value: metrics?.value },
		{ label: "Economic Buyer", value: economicBuyer?.value },
		{ label: "Decision Criteria", value: decisionCriteria?.value },
		{ label: "Decision Process", value: decisionProcess?.value },
		{ label: "Identify Pain", value: identifyPain?.value },
		{ label: "Champion", value: champion?.value },
		{ label: "Competition", value: competition?.value },
	];
	const allEmpty = fields.every(f => !f.value || (Array.isArray(f.value) && f.value.length === 0));
	if (allEmpty) return <div className="text-sm italic text-muted-foreground">No MEDDICC data.</div>;
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
			{fields.map((f, i) => (
				<div key={i} className="rounded-md border p-3">
					<div className="text-xs font-medium text-muted-foreground">{f.label}</div>
					{Array.isArray(f.value) ? (
						f.value.length ? (
							<ul className="list-disc pl-5 text-sm mt-1 space-y-1">
								{f.value.map((v, idx) => (
									<li key={idx}>{v}</li>
								))}
							</ul>
						) : (
							<div className="text-sm italic text-muted-foreground mt-1">No items.</div>
						)
					) : (
						<div className="text-sm mt-1 text-muted-foreground">{f.value || "-"}</div>
					)}
				</div>
			))}
		</div>
	);
}


