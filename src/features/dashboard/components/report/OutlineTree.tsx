"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { OutlineNode } from "./structure";

export function OutlineTree({ nodes, activeId, onSelect }: { nodes: OutlineNode[]; activeId?: string; onSelect: (id: string) => void }) {
  return (
    <nav aria-label="Report outline" className="text-sm">
      <ul className="space-y-1">
        {nodes.map((n) => (
          <OutlineItem key={n.id} node={n} activeId={activeId} onSelect={onSelect} depth={0} />
        ))}
      </ul>
    </nav>
  );
}

function OutlineItem({ node, activeId, onSelect, depth }: { node: OutlineNode; activeId?: string; onSelect: (id: string) => void; depth: number }) {
  const [open, setOpen] = React.useState(true);
  const hasChildren = !!node.children?.length;
  const isActive = activeId === node.id;

  return (
    <li>
      <div className={cn("flex items-center gap-2", isActive && "font-semibold")}>        
        {hasChildren ? (
          <button className="rounded-sm px-1 text-xs border" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`group-${node.id}`}>
            {open ? "-" : "+"}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}
        <button className="text-left hover:underline" onClick={() => onSelect(node.id)}>
          {node.label}
        </button>
      </div>
      {hasChildren && open && (
        <ul id={`group-${node.id}`} className="mt-1 ml-5 space-y-1">
          {node.children!.map((c) => (
            <OutlineItem key={c.id} node={c} activeId={activeId} onSelect={onSelect} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

