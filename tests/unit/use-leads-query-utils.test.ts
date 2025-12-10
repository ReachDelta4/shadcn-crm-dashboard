import { describe, expect, it } from "vitest";
import {
  buildLeadsQueryParams,
  buildLeadsQueryKey,
  mapLeadRecord,
} from "@/features/dashboard/pages/leads/hooks/use-leads";
import type { LeadFilters } from "@/features/dashboard/pages/leads/types/lead";

describe("useLeads query helpers", () => {
  it("buildLeadsQueryParams maps filters, pagination, and sorting to API params", () => {
    const filters: LeadFilters = {
      status: "qualified",
      search: "Acme",
      dateRange: {
        from: new Date("2024-01-10T00:00:00.000Z"),
        to: new Date("2024-01-31T00:00:00.000Z"),
      },
    };

    const params = buildLeadsQueryParams(
      { pageIndex: 2, pageSize: 25 },
      filters,
      [{ id: "fullName", desc: false }]
    );

    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("25");
    expect(params.get("search")).toBe("Acme");
    expect(params.get("status")).toBe("qualified");
    expect(params.get("dateFrom")).toBe("2024-01-10T00:00:00.000Z");
    expect(params.get("dateTo")).toBe("2024-01-31T00:00:00.000Z");
    // Sorting should map frontend field to API field names
    expect(params.get("sort")).toBe("full_name");
    expect(params.get("direction")).toBe("asc");
  });

  it("buildLeadsQueryKey produces a stable, serializable key shape", () => {
    const filters: LeadFilters = {
      status: "qualified",
      search: "  Acme Corp  ",
      dateRange: {
        from: new Date("2024-01-10T00:00:00.000Z"),
        to: new Date("2024-01-31T00:00:00.000Z"),
      },
    };

    const key = buildLeadsQueryKey(
      { pageIndex: 1, pageSize: 50 },
      filters,
      [{ id: "date", desc: true }],
    );

    expect(key[0]).toBe("leads");
    expect(key[1]).toEqual({
      pageIndex: 1,
      pageSize: 50,
      status: "qualified",
      search: "Acme Corp",
      dateFrom: "2024-01-10T00:00:00.000Z",
      dateTo: "2024-01-31T00:00:00.000Z",
      sortId: "date",
      sortDesc: true,
    });
  });

  it("mapLeadRecord safely normalizes API rows into Lead objects", () => {
    const normalized = mapLeadRecord({
      id: "lead-123",
      lead_number: "L-123",
      full_name: "Jane Smith",
      subject_id: "subj-1",
      email: "jane@example.com",
      value: "999",
      status: "contacted",
      date: "2024-02-02T10:00:00Z",
      updated_at: "2024-02-03T10:00:00Z",
      source: "referral",
    });

    expect(normalized.id).toBe("lead-123");
    expect(normalized.leadNumber).toBe("L-123");
    expect(normalized.fullName).toBe("Jane Smith");
    expect(normalized.email).toBe("jane@example.com");
    expect(normalized.phone).toBe("");
    expect(normalized.company).toBe("");
    expect(normalized.value).toBe(999);
    expect(normalized.status).toBe("contacted");
    expect(normalized.date).toBe("2024-02-02T10:00:00Z");
    expect(normalized.updatedAt).toBe("2024-02-03T10:00:00Z");
    expect(normalized.subjectId).toBe("subj-1");
    expect(normalized.source).toBe("referral");
  });

  it("mapLeadRecord falls back to defaults when data is incomplete", () => {
    const normalized = mapLeadRecord({});

    expect(normalized.id).toBe("");
    expect(normalized.leadNumber).toBe("");
    expect(normalized.fullName).toBe("");
    expect(normalized.value).toBe(0);
    expect(normalized.status).toBe("new");
    expect(typeof normalized.date).toBe("string");
  });
});
