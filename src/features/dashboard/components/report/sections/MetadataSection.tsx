"use client";

import React from "react";
type Props = {
	rep?: string;
	prospect?: string;
	primaryAsk?: string;
	repPerformance?: number;
	dealHealth?: number;
};
export function MetadataSection({ rep, prospect, primaryAsk, repPerformance, dealHealth }: Props) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[14px]">
			<div><span className="font-medium text-muted-foreground">Rep:</span> <span className="font-medium">{rep || "-"}</span></div>
			<div><span className="font-medium text-muted-foreground">Prospect:</span> <span className="font-medium">{prospect || "-"}</span></div>
			<div><span className="font-medium text-muted-foreground">Primary ask:</span> {primaryAsk || "-"}</div>
			<div><span className="font-medium text-muted-foreground">Rep Performance:</span> {repPerformance != null ? `${repPerformance} / 100` : "-"}</div>
			<div><span className="font-medium text-muted-foreground">Deal Health:</span> {dealHealth != null ? `${dealHealth} / 100` : "-"}</div>
		</div>
	);
}
