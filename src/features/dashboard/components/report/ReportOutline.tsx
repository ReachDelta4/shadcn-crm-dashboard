"use client";

import React from "react";
import { REPORT_STRUCTURE } from "./structure";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Props = {
	onSelect: (sectionId: string) => void;
};

export function ReportOutline({ onSelect }: Props) {
	const [openPages, setOpenPages] = React.useState<Record<string, boolean>>(() => {
		const o: Record<string, boolean> = {};
		for (const p of REPORT_STRUCTURE) o[p.id] = true;
		return o;
	});

	function toggle(pageId: string) {
		setOpenPages(prev => ({ ...prev, [pageId]: !prev[pageId] }));
	}

	return (
		<Card className="sticky top-2">
			<CardHeader>
				<CardTitle className="text-sm">Report Outline</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{REPORT_STRUCTURE.map(page => (
					<div key={page.id}>
						<button
							onClick={() => toggle(page.id)}
							aria-expanded={openPages[page.id]}
							className="flex w-full items-center justify-between text-left text-xs font-semibold text-muted-foreground mb-1"
						>
							<span>{page.label}</span>
							<span className="ml-2 text-muted-foreground">{openPages[page.id] ? "−" : "+"}</span>
						</button>
						{openPages[page.id] ? (
							<div className="space-y-1">
								{page.sections.map(sec => (
									<button
										key={sec.id}
										onClick={() => onSelect(sec.id)}
										className="text-left w-full text-sm hover:underline"
									>
										{sec.label}
									</button>
								))}
							</div>
						) : null}
					</div>
				))}
			</CardContent>
		</Card>
	);
}


