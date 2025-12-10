"use client";

import * as React from "react";
import { Lead, LeadStatus } from "../types/lead";
import { formatINRMajor } from "@/utils/currency";
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
import {
  buildLeadTransitionIdempotencyKey,
  isForwardTransition,
  getForwardTargetStatuses,
} from "@/features/leads/status-utils";

const COLUMNS: { key: LeadStatus; title: string }[] = [
  { key: "new", title: "New" },
  { key: "contacted", title: "Contacted" },
  { key: "qualified", title: "Qualified" },
  { key: "disqualified", title: "Disqualified" },
  { key: "converted", title: "Converted" },
];

function canonicalize(status: string): string {
  return status;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-blue-100 text-blue-800",
    contacted: "bg-amber-100 text-amber-800",
    qualified: "bg-emerald-100 text-emerald-800",
    disqualified: "bg-gray-200 text-gray-800",
    converted: "bg-green-100 text-green-800",
  };
  const key = canonicalize(status);
  const cls = map[key] || "bg-gray-100 text-gray-700";
  return <Badge className={cls}>{key}</Badge>;
}

export function LeadsKanban({
  leads,
  onStatusChanged,
}: {
  leads: Lead[];
  onStatusChanged?: () => void;
}) {
  const [items, setItems] = React.useState<Lead[]>(leads);

  React.useEffect(() => {
    setItems(leads);
  }, [leads]);

  const updateStatus = async (lead: Lead, next: LeadStatus) => {
    const current = lead.status as LeadStatus;

    if (current === next) return;
    if (!isForwardTransition(current, next)) {
      toast.error("Only forward lifecycle moves are allowed for leads.");
      return;
    }

    const prevItems = items;
    setItems((arr) =>
      arr.map((l) => (l.id === lead.id ? { ...l, status: next } : l)),
    );

    const toastId = toast.loading("Updating lead.");

    try {
      const idempotencyKey = buildLeadTransitionIdempotencyKey(
        lead.id,
        current,
        next,
      );

      const res = await fetch(`/api/leads/${lead.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_status: next,
          idempotency_key: idempotencyKey,
        }),
      });

      if (!res.ok) {
        if (res.status === 409) {
          toast.error("Transition denied by lifecycle rules", {
            id: toastId,
          });
        } else {
          let msg = "";
          try {
            msg = await res.text();
          } catch {
            // ignore
          }
          toast.error(msg || "Failed to update lead", { id: toastId });
        }
        setItems(prevItems);
        return;
      }

      toast.success("Lead updated", { id: toastId });
      try {
        window.dispatchEvent(new Event("leads:changed"));
      } catch {
        // ignore
      }
      onStatusChanged?.();
    } catch {
      setItems(prevItems);
      toast.error("Failed to update lead", { id: toastId });
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
                <span className="text-muted-foreground ml-2 text-xs">
                  {colItems.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {colItems.length === 0 ? (
                <div className="text-muted-foreground text-xs">No leads</div>
              ) : (
                colItems.map((lead) => {
                  const current = lead.status as LeadStatus;
                  const forwardTargets = getForwardTargetStatuses(current);

                  return (
                  <div key={lead.id} className="rounded-md border p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {lead.fullName}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {lead.company}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Lead actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Move to</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {forwardTargets.map((target) => {
                            const column = COLUMNS.find((c) => c.key === target);
                            if (!column) return null;
                            return (
                              <DropdownMenuItem
                                key={column.key}
                                onClick={() => updateStatus(lead, column.key)}
                                aria-label={`Move to ${column.title}`}
                              >
                                {column.title}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <StatusBadge status={lead.status} />
                      <span className="tabular-nums">
                        {formatINRMajor(lead.value)}
                      </span>
                    </div>
                  </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
