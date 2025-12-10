export function buildAppointmentIdempotencyKey(
  leadId: string,
  startAtUtc: string,
  endAtUtc: string,
): string {
  const start = startAtUtc || "unknown_start";
  const end = endAtUtc || "unknown_end";
  return `lead:${leadId}:appointment:${start}->${end}`;
}

