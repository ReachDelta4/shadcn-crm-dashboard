"use client";

import React from "react";
export function TitleSection({ title }: { title: string }) {
	return (
		<div className="flex items-center justify-center min-h-28 mb-2">
			<h1 className="text-3xl font-semibold tracking-tight text-center">{title}</h1>
		</div>
	);
}
