"use client";

import { useState } from "react";
import { Lead } from "@/features/dashboard/pages/leads/types/lead";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  buildLeadTransitionIdempotencyKey,
  isForwardTransition,
} from "@/features/leads/status-utils";

interface Props {
  lead: Lead;
  onChanged?: () => void;
}

type TargetStatus = "new" | "contacted" | "qualified" | "disqualified" | "converted";

export function LeadStatusDropdown({ lead, onChanged }: Props) {
  const [target, setTarget] = useState<TargetStatus>(lead.status as any);

  async function submitTransition(payload: any) {
    const res = await fetch(`/api/leads/${lead.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    onChanged?.();
    try {
      window.dispatchEvent(new Event("leads:changed"));
    } catch {
      // ignore
    }
  }

  async function handleChange(next: TargetStatus) {
    const current = lead.status as TargetStatus;

    if (current === next) {
      setTarget(current);
      return;
    }

    if (!isForwardTransition(current, next)) {
      setTarget(current);
      toast.error("Only forward lifecycle moves are allowed for leads.");
      return;
    }

    setTarget(next);

    try {
      const idempotencyKey = buildLeadTransitionIdempotencyKey(
        lead.id,
        current,
        next,
      );
      await submitTransition({
        target_status: next,
        idempotency_key: idempotencyKey,
      });
      toast.success(`Lead moved to ${next}`);
    } catch {
      setTarget(current);
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={target} onValueChange={(v: any) => handleChange(v)}>
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Change status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="new">New</SelectItem>
          <SelectItem value="contacted">Contacted</SelectItem>
          <SelectItem value="qualified">Qualified</SelectItem>
          <SelectItem value="disqualified">Disqualified</SelectItem>
          <SelectItem value="converted">Converted</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

