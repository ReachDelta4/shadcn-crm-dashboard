"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

interface Props {
	selectedIds: string[];
	onClear: () => void;
	onSuccess?: () => void;
}

export function BulkActionsToolbar({ selectedIds, onClear, onSuccess }: Props) {
	const [targetStatus, setTargetStatus] = useState<string>("")
	const [loading, setLoading] = useState(false)

	async function handleBulkTransition() {
		if (!targetStatus) {
			toast.error("Select a target status")
			return
		}

		setLoading(true)
		try {
			const res = await fetch("/api/leads/bulk/transition", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ lead_ids: selectedIds, target_status: targetStatus }),
			})

			const data = await res.json()

			if (!res.ok) {
				throw new Error(data.error || "Bulk transition failed")
			}

			toast.success(`Updated ${data.successful} of ${data.total} leads`)
			onClear()
			onSuccess?.()
		} catch (error: any) {
			toast.error(error.message || "Failed to update leads")
		} finally {
			setLoading(false)
		}
	}

	if (selectedIds.length === 0) return null

	return (
		<div className="flex items-center gap-3 p-3 bg-muted/50 border-b">
			<span className="text-sm font-medium">{selectedIds.length} selected</span>
			<Select value={targetStatus} onValueChange={setTargetStatus}>
				<SelectTrigger className="w-[200px]">
					<SelectValue placeholder="Change status to..." />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="new">New</SelectItem>
					<SelectItem value="contacted">Contacted</SelectItem>
					<SelectItem value="qualified">Qualified</SelectItem>
					<SelectItem value="proposal_negotiation">Proposal/Negotiation</SelectItem>
					<SelectItem value="won">Won</SelectItem>
					<SelectItem value="lost">Lost</SelectItem>
				</SelectContent>
			</Select>
			<Button onClick={handleBulkTransition} disabled={loading || !targetStatus}>
				{loading ? "Updating..." : "Apply"}
			</Button>
			<Button variant="outline" onClick={onClear}>
				Clear Selection
			</Button>
		</div>
	)
}
