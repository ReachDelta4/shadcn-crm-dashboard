"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export type TitleCardProps = {
	title?: string;
	subtitle?: string;
	deal?: string;
	sessionId?: string;
};

export function TitleCard({ title, subtitle, deal, sessionId }: TitleCardProps) {
	return (
		<Card className="mx-auto w-full max-w-[794px]" data-component="title-card">
			<CardContent className="p-6 space-y-2">
				<div id="tp_title" data-section-id="tp_title" className="scroll-mt-24 text-2xl font-semibold tracking-tight text-center">
					{title || "Sales Call Report"}
				</div>
				<div id="tp_subtitle" data-section-id="tp_subtitle" className="scroll-mt-24 text-sm text-muted-foreground text-center">
					{subtitle || "Deal / Session ID placeholder"}
				</div>
				{deal || sessionId ? (
					<div className="text-sm text-center text-muted-foreground">
						{deal ? <span><span className="font-medium">Deal:</span> {deal}</span> : null}
						{deal && sessionId ? <span>  ·  </span> : null}
						{sessionId ? <span><span className="font-medium">Session ID:</span> {sessionId}</span> : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
