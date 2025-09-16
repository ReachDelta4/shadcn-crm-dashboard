"use client";

import React from "react";

export function ExecSummarySection({ headline, synopsis }: { headline?: string; synopsis?: string }) {
	return (
		<div data-component="exec-summary">
			<div className="text-base font-semibold mb-1">{headline || "Headline verdict goes here."}</div>
			<div className="text-[15px] text-muted-foreground">{synopsis || "Short 2–3 line synopsis placeholder."}</div>
		</div>
	);
}
