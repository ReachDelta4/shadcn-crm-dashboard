"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { evaluateBulkActionGuard, formatStatusLabel } from "./bulk-actions-guard";
import type { LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import { mapBulkStatusToCanonical } from "@/features/leads/status-utils";

interface Props {
	selectedIds: string[];
	onClear: () => void;
	onSuccess?: () => void;
}

export function BulkActionsToolbar({ selectedIds, onClear, onSuccess }: Props) {
	const [targetStatus, setTargetStatus] = useState<string>("")
	const [loading, setLoading] = useState(false)
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [hasConfirmed, setHasConfirmed] = useState(false)

	useEffect(() => {
		setHasConfirmed(false)
	}, [targetStatus, selectedIds])

	function resolveTargetStatus(): LeadStatus | null {
		return mapBulkStatusToCanonical(targetStatus)
	}

	async function executeBulkTransition() {
		setLoading(true)
		try {
			const canonical = resolveTargetStatus()
			if (!canonical) {
				toast.error("Unsupported target status")
				return
			}

			const res = await fetch("/api/leads/bulk/transition", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ lead_ids: selectedIds, target_status: canonical }),
			})

			const data = await res.json()

			if (!res.ok) {
				const detail = data?.error || data?.message
				throw new Error(detail || "Bulk transition failed")
			}

			const updated = typeof data.successful === "number" ? data.successful : 0
			const skipped = typeof data.skipped === "number" ? data.skipped : 0
			const failed = typeof data.failed === "number" ? data.failed : (data.total && updated ? data.total - updated : 0)
			toast.success(`Updated ${updated} leads (skipped ${skipped}, failed ${failed})`)
			onClear()
			onSuccess?.()
		} catch (error: any) {
			toast.error(error.message || "Failed to update leads")
		} finally {
			setLoading(false)
			setHasConfirmed(false)
		}
	}

	async function handleBulkTransition() {
		const guard = evaluateBulkActionGuard({
			selectedCount: selectedIds.length,
			targetStatus,
			confirmed: hasConfirmed,
		})

		if (guard.action === "error") {
			toast.error(guard.message)
			return
		}

		if (guard.action === "confirm") {
			setConfirmOpen(true)
			return
		}

		await executeBulkTransition()
	}

	if (selectedIds.length === 0) return null

	return (
		<>
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

			<AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Confirm bulk status change</AlertDialogTitle>
						<AlertDialogDescription>
							Change {selectedIds.length} leads to {formatStatusLabel(targetStatus)}? This applies to all currently selected leads.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setHasConfirmed(false)}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								setHasConfirmed(true)
								setConfirmOpen(false)
								await handleBulkTransition()
							}}
						>
							Confirm change
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
