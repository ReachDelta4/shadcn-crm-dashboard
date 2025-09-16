"use client";

import React from "react";

export function RecommendationSection({ text }: { text?: string }) {
	return (
		<div className="text-sm" data-component="recommendation">
			<span className="font-medium">Recommendation:</span> {text || "Single recommended coaching focus placeholder."}
		</div>
	);
}
