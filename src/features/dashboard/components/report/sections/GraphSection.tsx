"use client";

import React from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, CartesianGrid, XAxis, YAxis } from "recharts";
type Series = { label: string; value: number };
export function GraphSection({ series, overall, dealHealth, mode }: { series?: Series[]; overall?: number; dealHealth?: number; mode?: "bar" | "line" }) {
	const data = series || [];
	const isLine = mode === "line";
	return (
		<div className="space-y-3">
			<div className="text-[16px] font-semibold">Performance by Stage</div>
			{data.length === 0 ? (
				<div className="space-y-2">
					<div className="text-sm italic text-muted-foreground">No chart data.</div>
					<div className="space-y-1.5">
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} className="h-2.5 bg-muted rounded w-full" />
						))}
					</div>
				</div>
			) : isLine ? (
				<ChartContainer id="stage-line" config={{ score: { label: "Stage Score", color: "#10b981" } }}>
					<LineChart data={data.map(d => ({ label: d.label, value: Math.max(0, Math.min(100, d.value)) }))} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
						<CartesianGrid vertical={false} strokeDasharray="3 3" />
						<XAxis dataKey="label" tickLine={false} axisLine={false} interval={0} tick={{ fontSize: 10 }} height={28} />
						<YAxis domain={[0, 100]} tickCount={6} tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={28} />
						<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
						<Line type="monotone" dataKey="value" stroke="var(--color-score)" strokeWidth={2} dot={{ r: 2 }} />
					</LineChart>
				</ChartContainer>
			) : (
				<ChartContainer id="stage-chart" config={{ a: { label: "A", color: "#10b981" } }}>
					<div className="flex flex-col gap-1.5 text-[13px]">
						{data.map((s, i) => (
							<div key={i} className="flex items-center gap-2">
								<div className="w-48 shrink-0 truncate">{s.label}</div>
								<div className="h-2.5 bg-primary/20 rounded w-full">
									<div className="h-2.5 bg-primary rounded" style={{ width: `${Math.min(100, Math.max(0, s.value))}%` }} />
								</div>
								<div className="w-10 text-right">{s.value}</div>
							</div>
						))}
					</div>
				</ChartContainer>
			)}
			<div className="text-xs text-muted-foreground">Weighted Overall: {overall != null ? `${overall} / 100` : "-"} · Deal Health: {dealHealth != null ? `${dealHealth} / 100` : "-"}</div>
		</div>
	);
}
