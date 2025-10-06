"use client";

import { useState } from "react";
import { Lead } from "@/features/dashboard/pages/leads/types/lead";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

interface Props { lead: Lead; onChanged?: () => void }

type TargetStatus = 'new'|'contacted'|'qualified'|'disqualified'|'converted'

export function LeadStatusDropdown({ lead, onChanged }: Props) {
	const [target, setTarget] = useState<TargetStatus>(lead.status as any)
    

    

    

	async function submitTransition(payload: any) {
		const res = await fetch(`/api/leads/${lead.id}/transition`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
		})
		if (!res.ok) throw new Error(await res.text())
		onChanged?.()
	}

	async function handleChange(next: TargetStatus) {
		setTarget(next)
        try {
            await submitTransition({ target_status: next })
			toast.success(`Lead moved to ${next}`)
		} catch {
			toast.error('Failed to update status')
		}
	}

    

	return (
		<div className="flex items-center gap-2">
            <Select value={target} onValueChange={(v:any) => handleChange(v)}>
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
	)
}


