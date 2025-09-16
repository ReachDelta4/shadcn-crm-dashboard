"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { REPORT_STRUCTURE_V3, type OutlineNode } from "./structure.v3";

function Node({ node, depth, onSelect }: { node: OutlineNode; depth: number; onSelect: (id: string) => void }) {
	const [open, setOpen] = React.useState(true);
	const hasChildren = !!node.children && node.children.length > 0;
	return (
		<div>
			<div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
				{hasChildren ? (
					<button onClick={() => setOpen(o => !o)} aria-expanded={open} className="text-xs text-muted-foreground mr-1 w-4">
						{open ? "−" : "+"}
					</button>
				) : <span className="w-4" />}
				<button onClick={() => onSelect(node.id)} className={"text-left text-sm hover:underline " + (hasChildren ? "font-semibold" : "")}>{node.label}</button>
			</div>
			{hasChildren && open ? (
				<div className="space-y-1 mt-1">
					{node.children!.map(child => (
						<Node key={child.id} node={child} depth={depth + 1} onSelect={onSelect} />
					))}
				</div>
			) : null}
		</div>
	);
}

export function ReportOutlineV3({ onSelect }: { onSelect: (id: string) => void }) {
	return (
		<Card className="sticky top-2">
			<CardHeader>
				<CardTitle className="text-sm">Report Outline</CardTitle>
			</CardHeader>
			<CardContent className="space-y-1">
				{REPORT_STRUCTURE_V3.map(n => (
					<Node key={n.id} node={n} depth={0} onSelect={onSelect} />
				))}
			</CardContent>
		</Card>
	);
}
