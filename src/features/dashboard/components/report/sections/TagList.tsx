"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";

export function TagList({ tags }: { tags?: string[] }) {
	if (!tags || tags.length === 0) return <div className="text-xs italic text-muted-foreground">No tags</div>;
	return (
		<div className="flex flex-wrap gap-1.5" data-component="tag-list">
			{tags.map((t, i) => (
				<Badge key={i} variant="secondary" className="text-xs py-0.5 px-2">{t}</Badge>
			))}
		</div>
	);
}
