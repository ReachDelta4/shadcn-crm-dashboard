"use client";

import React from "react";
import { BulletsSection } from "./BulletsSection";
import { QuotesSection } from "./QuotesSection";

export type StageDeepDive = {
	stageName: string;
	objective?: string;
	indicators?: string[];
	observed?: string[];
	score?: number;
	weight?: number;
	mistakes?: string[];
	whatToSay?: string[];
	positives?: string[];
	coaching?: string[];
	quickFix?: string;
	actions?: { id: string; title: string; owner?: string; due?: string }[];
};

export function StageDeepDiveSection({ stages }: { stages?: StageDeepDive[] }) {
	const data = stages || [];
	if (data.length === 0) return <div className="text-sm italic text-muted-foreground">No stage deep dives yet.</div>;
	return (
		<div className="space-y-4" data-component="stage-deep-dive">
			{data.map((s, i) => (
				<div key={i} className="rounded-md border p-3 space-y-3" data-item-id={i}>
					<div className="text-[18px] font-semibold">{s.stageName}</div>
					{s.objective ? <div className="text-sm"><span className="font-medium">Objective:</span> {s.objective}</div> : null}
					<BulletsSection title="Indicators / Data" items={s.indicators} />
					<BulletsSection title="Observed Behavior" items={s.observed} />
					<div className="text-xs text-muted-foreground">
						{s.score != null ? `Score: ${s.score}/100` : ""}{s.weight != null ? ` · Weight: ${s.weight}%` : ""}
					</div>
					<BulletsSection title="Mistakes & Missed Opportunities" items={s.mistakes} />
					<BulletsSection title="What to say instead" items={s.whatToSay} />
					<BulletsSection title="Handled well" items={s.positives} />
					<BulletsSection title="Coaching notes & drills" items={s.coaching} />
					{s.quickFix ? <div className="text-sm"><span className="font-medium">Quick fix:</span> {s.quickFix}</div> : null}
				</div>
			))}
		</div>
	);
}
