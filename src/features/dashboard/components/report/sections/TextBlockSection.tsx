"use client";

import React from "react";

type Props = {
	title?: string;
	text?: string;
};

export function TextBlockSection({ title, text }: Props) {
	return (
		<div>
			{title ? <div className="text-sm font-semibold mb-1">{title}</div> : null}
			<div className="text-sm whitespace-pre-wrap">{text || "-"}</div>
		</div>
	);
}


