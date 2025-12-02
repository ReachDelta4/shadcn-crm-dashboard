import { describe, expect, it } from "vitest";
import {
  buildLeadsQueryParams,
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

  it("mapLeadRecord safely normalizes API rows into Lead objects", () => {
    const normalized = mapLeadRecord({
      id: "lead-123",
      lead_number: "L-123",
      full_name: "Jane Smith",
      email: "jane@example.com",
      value: "999",
      status: "contacted",
      date: "2024-02-02T10:00:00Z",
      source: "referral",
    });

    expect(normalized).toEqual({
      id: "lead-123",
      leadNumber: "L-123",
      fullName: "Jane Smith",
      email: "jane@example.com",
      phone: "",
      company: "",
      value: 999,
      status: "contacted",
      date: "2024-02-02T10:00:00Z",
      source: "referral",
    });
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
