"use client";

import React from "react";
import { Button } from "@/components/ui/button";
export function ScriptsSection({ emailSubject, cta, scripts }: { emailSubject?: string; cta?: string; scripts?: string[] }) {
	const data = scripts || [];
	return (
		<div className="space-y-2 text-[14px]">
			<div>
				<div className="font-medium">Email subject:</div>
				<div className="mt-0.5 text-muted-foreground">{emailSubject || "No subject yet."}</div>
			</div>
			<div>
				<div className="font-medium">One‑line CTA:</div>
				<div className="mt-0.5 text-muted-foreground">{cta || "No CTA yet."}</div>
			</div>
			<div>
				<div className="font-medium mb-1">Scripts</div>
				{data.length === 0 ? (
					<div className="text-sm italic text-muted-foreground">No scripts yet.</div>
				) : (
					<div className="space-y-1.5">
						{data.map((s, i) => (
							<div key={i} className="flex items-start justify-between gap-2">
								<p className="flex-1 leading-relaxed">{s}</p>
								<Button size="sm" variant="ghost" onClick={() => typeof navigator !== "undefined" && navigator.clipboard.writeText(s)}>Copy</Button>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
