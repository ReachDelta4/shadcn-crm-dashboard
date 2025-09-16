"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { REPORT_STRUCTURE_V3, type OutlineNode } from "./structure.v3";

function Node({ node, depth, onSelect, activeId }: { node: OutlineNode; depth: number; onSelect: (id: string) => void; activeId?: string }) {
	const [open, setOpen] = React.useState(true);
	const hasChildren = !!node.children && node.children.length > 0;
	const isActive = activeId === node.id;
	return (
		<div>
			<div className="flex items-center" style={{ paddingLeft: depth * 12 }}>
				{hasChildren ? (
					<button onClick={() => setOpen(o => !o)} aria-expanded={open} className="text-xs text-muted-foreground mr-1 w-4">
						{open ? "−" : "+"}
					</button>
				) : <span className="w-4" />}
				<button onClick={() => onSelect(node.id)} aria-controls={node.id} aria-current={isActive ? "true" : undefined} role="treeitem" aria-level={depth + 1} data-outline-id={node.id} className={(depth === 0 ? "text-[16px] font-semibold " : "text-sm ") + "text-left hover:underline " + (isActive ? " bg-muted/50 rounded px-1" : "")}>{node.label}</button>
			</div>
			{hasChildren && open ? (
				<div className="space-y-1 mt-1">
					{node.children!.map(child => (
						<Node key={child.id} node={child} depth={depth + 1} onSelect={onSelect} activeId={activeId} />
					))}
				</div>
			) : null}
		</div>
	);
}

export function ReportOutlineV3({ onSelect, activeId }: { onSelect: (id: string) => void; activeId?: string }) {
	const contentRef = React.useRef<HTMLDivElement | null>(null);
	React.useEffect(() => {
		if (!activeId || !contentRef.current) return;
		const container = contentRef.current;
		const el = container.querySelector(`[data-outline-id='${activeId}']`) as HTMLElement | null;
		if (!el) return;

		const targetTop = el.offsetTop;
		const targetBottom = targetTop + el.offsetHeight;
		const viewTop = container.scrollTop;
		const viewBottom = viewTop + container.clientHeight;
		const bias = 16;

		if (targetTop < viewTop + bias) {
			container.scrollTo({ top: Math.max(0, targetTop - container.clientHeight / 3), behavior: "smooth" });
		} else if (targetBottom > viewBottom - bias) {
			container.scrollTo({ top: Math.min(container.scrollHeight, targetBottom - (container.clientHeight / 2)), behavior: "smooth" });
		}
	}, [activeId]);
	return (
		<Card className="h-full">
			<CardHeader>
				<CardTitle className="text-sm">Report Outline</CardTitle>
			</CardHeader>
			<CardContent ref={contentRef} className="space-y-1 max-h-[calc(100vh-16px)] overflow-auto">
				{REPORT_STRUCTURE_V3.map(n => (
					<Node key={n.id} node={n} depth={0} onSelect={onSelect} activeId={activeId} />
				))}
			</CardContent>
		</Card>
	);
}
