import { describe, it, expect } from "vitest";
import {
  STATUS_SEQUENCE,
  isForwardTransition,
  mapBulkStatusToCanonical,
  getForwardTargetStatuses,
} from "@/features/leads/status-utils";

describe("Lead status helpers - transitions and mapping", () => {
  it("only allows forward transitions within STATUS_SEQUENCE", () => {
    const sequence = STATUS_SEQUENCE;

    for (let i = 0; i < sequence.length; i++) {
      const current = sequence[i];

      // Same status should not be treated as forward transition
      expect(isForwardTransition(current, current)).toBe(false);

      // All later statuses in the sequence should be allowed
      for (let j = i + 1; j < sequence.length; j++) {
        const target = sequence[j];
        expect(isForwardTransition(current, target)).toBe(true);
      }

      // All earlier statuses should be disallowed
      for (let j = 0; j < i; j++) {
        const target = sequence[j];
        expect(isForwardTransition(current, target)).toBe(false);
      }
    }
  });

  it("maps bulk UI statuses to canonical lifecycle targets", () => {
    expect(mapBulkStatusToCanonical("new")).toBe("new");
    expect(mapBulkStatusToCanonical("contacted")).toBe("contacted");
    expect(mapBulkStatusToCanonical("qualified")).toBe("qualified");

    // Legacy or high-level UI modes
    expect(mapBulkStatusToCanonical("proposal_negotiation")).toBe("qualified");
    expect(mapBulkStatusToCanonical("won")).toBe("converted");
    expect(mapBulkStatusToCanonical("lost")).toBe("disqualified");

    // Unknown modes should return null so callers can handle gracefully
    expect(mapBulkStatusToCanonical("unknown")).toBeNull();
  });

  it("getForwardTargetStatuses returns only forward lifecycle statuses", () => {
    expect(getForwardTargetStatuses("new")).toEqual([
      "contacted",
      "qualified",
      "disqualified",
      "converted",
    ]);

    expect(getForwardTargetStatuses("qualified")).toEqual([
      "disqualified",
      "converted",
    ]);

    expect(getForwardTargetStatuses("converted")).toEqual([]);
  });

  it("buildLeadCreationIdempotencyKey normalizes inputs into a stable key", async () => {
    const { buildLeadCreationIdempotencyKey } = await import(
      "@/features/leads/status-utils"
    );

    const key1 = buildLeadCreationIdempotencyKey({
      fullName: " Jane Doe ",
      email: "JANE@example.com ",
      phone: " +1 (555) 000-1234 ",
      company: "Acme Inc",
    });

    const key2 = buildLeadCreationIdempotencyKey({
      fullName: "jane doe",
      email: "jane@example.com",
      phone: "15550001234",
      company: " acme inc ",
    });

    expect(key1).toBe(key2);
    expect(key1).toContain("lead:create:");
  });
});
