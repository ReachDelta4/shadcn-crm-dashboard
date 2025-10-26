import type { LeadStatus } from "@/features/dashboard/pages/leads/types/lead";

export const STATUS_SEQUENCE: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "disqualified",
  "converted",
];

export const APPOINTMENT_TARGET_STATUS: LeadStatus = "qualified";

export const MODE_TARGET_STATUS: Record<"invoice_sent" | "won", LeadStatus> = {
  invoice_sent: "qualified",
  won: "converted",
};

export function shouldAdvanceToQualified(current?: LeadStatus): boolean {
  if (!current) return true;
  if (current === "disqualified" || current === "converted") return false;
  const currentIdx = STATUS_SEQUENCE.indexOf(current);
  const targetIdx = STATUS_SEQUENCE.indexOf(APPOINTMENT_TARGET_STATUS);
  if (currentIdx === -1) return true;
  return currentIdx < targetIdx;
}

export function isForwardTransition(
  current: LeadStatus,
  target: LeadStatus
): boolean {
  if (current === target) return false;
  const currentIdx = STATUS_SEQUENCE.indexOf(current);
  const targetIdx = STATUS_SEQUENCE.indexOf(target);
  if (currentIdx === -1 || targetIdx === -1) {
    return false;
  }
  return targetIdx >= currentIdx;
}
