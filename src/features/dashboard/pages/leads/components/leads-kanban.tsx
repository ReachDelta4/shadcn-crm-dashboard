"use client";

import * as React from "react";
import { Lead, LeadStatus } from "../types/lead";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

const COLUMNS: { key: LeadStatus; title: string }[] = [
  { key: "new", title: "New" },
  { key: "contacted", title: "Contacted" },
  { key: "qualified", title: "Qualified" },
  { key: "disqualified", title: "Disqualified" },
  { key: "converted", title: "Converted" },
];

function canonicalize(status: string): string { return status }

function StatusBadge({ status }: { status: string }) {
  const s = canonicalize(status) as keyof typeof map
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-amber-100 text-amber-800",
    qualified: "bg-emerald-100 text-emerald-800",
    disqualified: "bg-gray-200 text-gray-800",
    converted: "bg-green-100 text-green-800",
  };
  const cls = map[s] || "bg-gray-100 text-gray-700"
  return <Badge className={cls}>{s}</Badge>;
}

export function LeadsKanban({ leads, onStatusChanged }: { leads: Lead[]; onStatusChanged?: () => void }) {
  const [items, setItems] = React.useState<Lead[]>(leads);
  React.useEffect(() => setItems(leads), [leads]);

  const updateStatus = async (lead: Lead, next: LeadStatus) => {
    if (lead.status === next) return;
    const prev = items;
    // optimistic
    setItems((arr) => arr.map((l) => (l.id === lead.id ? { ...l, status: next } : l)));
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Lead updated");
      onStatusChanged?.();
    } catch (e) {
      setItems(prev);
      toast.error("Failed to update lead");
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const colItems = items.filter((l) => l.status === col.key);
        return (
          <Card key={col.key} aria-label={`${col.title} column`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">
                {col.title}
                <span className="text-muted-foreground ml-2 text-xs">{colItems.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {colItems.length === 0 ? (
                <div className="text-muted-foreground text-xs">No leads</div>
              ) : (
                colItems.map((lead) => (
                  <div key={lead.id} className="rounded-md border p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{lead.fullName}</div>
                        <div className="text-muted-foreground truncate text-xs">{lead.company}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Lead actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Move to</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {COLUMNS.map((c) => (
                            <DropdownMenuItem key={c.key} onClick={() => updateStatus(lead, c.key)} aria-label={`Move to ${c.title}`}>
                              {c.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <StatusBadge status={lead.status} />
                      <span className="tabular-nums">${lead.value.toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
