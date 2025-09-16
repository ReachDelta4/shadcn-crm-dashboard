"use client";

import React from "react";

export type TodoItem = {
	id: string;
	title: string;
	owner?: string;
	due?: string;
	details?: string;
	done?: boolean;
};

type Props = {
	items: TodoItem[];
	onToggle?: (id: string, done: boolean) => void;
};

export function PlayfulTodolist({ items, onToggle }: Props) {
	if (!items || items.length === 0) return <div className="text-sm italic text-muted-foreground">No tasks yet.</div>;
	return (
		<div className="space-y-2" data-component="playful-todolist">
			{items.map((it) => (
				<label key={it.id} className="flex items-start gap-3 p-2 rounded-md border hover:bg-muted/30 cursor-pointer" data-item-id={it.id}>
					<input
						type="checkbox"
						className="mt-1 size-4"
						checked={!!it.done}
						onChange={(e) => onToggle?.(it.id, e.target.checked)}
					/>
					<div className="flex-1">
						<div className={"text-sm " + (it.done ? "line-through decoration-wavy decoration-amber-500/70" : "")}>{it.title}</div>
						<div className="text-xs text-muted-foreground mt-0.5">
							{it.owner ? `Owner: ${it.owner}` : ""}{it.owner && it.due ? " · " : ""}{it.due ? `Due: ${it.due}` : ""}
						</div>
						{it.details ? <div className="text-xs mt-1">{it.details}</div> : null}
					</div>
				</label>
			))}
		</div>
	);
}


