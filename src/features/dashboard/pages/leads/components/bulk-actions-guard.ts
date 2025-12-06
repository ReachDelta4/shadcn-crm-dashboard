export type BulkActionGuardResult =
  | { action: "error"; message: string }
  | { action: "confirm" }
  | { action: "execute" };

export function evaluateBulkActionGuard(params: {
  selectedCount: number;
  targetStatus?: string;
  confirmed: boolean;
}): BulkActionGuardResult {
  if (params.selectedCount <= 0) return { action: "error", message: "No leads selected" };
  if (!params.targetStatus) return { action: "error", message: "Select a target status" };
  if (!params.confirmed) return { action: "confirm" };
  return { action: "execute" };
}

export function formatStatusLabel(status: string) {
  const labels: Record<string, string> = {
    new: "New",
    contacted: "Contacted",
    qualified: "Qualified",
    disqualified: "Disqualified",
    converted: "Converted",
    "proposal_negotiation": "Proposal / Negotiation",
    won: "Won",
    lost: "Lost",
  };
  return labels[status] || status;
}
