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

export function buildLeadCreationIdempotencyKey(input: {
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
}): string | null {
  const full = (input.fullName || "").trim().toLowerCase();
  const email = (input.email || "").trim().toLowerCase();
  const phone = (input.phone || "").replace(/\D+/g, "");
  const company = (input.company || "").trim().toLowerCase();

  const payload = [full, email, phone, company].join("|");
  if (!payload.replace(/\|/g, "")) {
    return null;
  }

  return `lead:create:${payload}`;
}

export function buildLeadTransitionIdempotencyKey(
  leadId: string,
  current: LeadStatus | string | null | undefined,
  target: LeadStatus,
): string {
  const from = (current || "unknown").toString();
  return `lead:${leadId}:${from}->${target}`;
}

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

export function getForwardTargetStatuses(current: LeadStatus): LeadStatus[] {
  return STATUS_SEQUENCE.filter((target) => isForwardTransition(current, target));
}

const BULK_STATUS_MAP: Record<string, LeadStatus> = {
  proposal_negotiation: "qualified",
  won: MODE_TARGET_STATUS.won,
  lost: "disqualified",
};

export function mapBulkStatusToCanonical(status: string): LeadStatus | null {
  const mapped = BULK_STATUS_MAP[status];
  if (mapped) return mapped;
  if (STATUS_SEQUENCE.includes(status as LeadStatus)) {
    return status as LeadStatus;
  }
  return null;
}
