"use client";

import React from "react";
export function BulletsSection({ items, title }: { items?: string[]; title?: string }) {
	const hasItems = !!items && items.length > 0;
	return (
		<div>
			{title ? <div className="text-[16px] font-semibold mb-1">{title}</div> : null}
			{hasItems ? (
				<ul className="list-disc pl-5 text-[14px] space-y-1.5">
					{items!.map((it, i) => (
						<li key={i}>{it}</li>
					))}
				</ul>
			) : (
				<div className="text-sm italic text-muted-foreground">No items yet.</div>
			)}
		</div>
	);
}
