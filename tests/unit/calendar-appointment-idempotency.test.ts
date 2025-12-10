import { describe, it, expect } from "vitest";
import { buildAppointmentIdempotencyKey } from "@/features/calendar/appointment-idempotency";

describe("buildAppointmentIdempotencyKey", () => {
  it("produces stable keys for the same inputs", () => {
    const leadId = "lead-123";
    const start = "2025-01-01T10:00:00.000Z";
    const end = "2025-01-01T11:00:00.000Z";

    const a = buildAppointmentIdempotencyKey(leadId, start, end);
    const b = buildAppointmentIdempotencyKey(leadId, start, end);

    expect(a).toBe(b);
  });

  it("changes when any of lead, start, or end change", () => {
    const base = buildAppointmentIdempotencyKey(
      "lead-1",
      "2025-01-01T10:00:00.000Z",
      "2025-01-01T11:00:00.000Z",
    );

    const differentLead = buildAppointmentIdempotencyKey(
      "lead-2",
      "2025-01-01T10:00:00.000Z",
      "2025-01-01T11:00:00.000Z",
    );
    const differentStart = buildAppointmentIdempotencyKey(
      "lead-1",
      "2025-01-01T09:00:00.000Z",
      "2025-01-01T11:00:00.000Z",
    );
    const differentEnd = buildAppointmentIdempotencyKey(
      "lead-1",
      "2025-01-01T10:00:00.000Z",
      "2025-01-01T12:00:00.000Z",
    );

    expect(differentLead).not.toBe(base);
    expect(differentStart).not.toBe(base);
    expect(differentEnd).not.toBe(base);
  });
});

