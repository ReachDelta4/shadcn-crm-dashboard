"use client";

import React from "react";
import { Progress } from "@/components/ui/progress";

export function DealHealthSection({ score, rationale }: { score?: number; rationale?: string }) {
	const val = typeof score === "number" ? Math.max(0, Math.min(100, score)) : undefined;
	return (
		<div className="space-y-2" data-component="deal-health">
			<div className="flex items-center justify-between text-sm">
				<div className="font-medium">Deal Health</div>
				<div className="text-xs text-muted-foreground">{val != null ? `${val}/100` : "-"}</div>
			</div>
			<Progress value={val || 0} />
			{rationale ? <div className="text-xs text-muted-foreground">{rationale}</div> : null}
		</div>
	);
}
