import { describe, it, expect } from "vitest";

interface LeadLike {
  id?: string;
  full_name?: string;
  email?: string;
  phone?: string | null;
  status?: string | null;
}

function normalizeInvoiceLeadOptions(rows: LeadLike[]) {
  return (rows || [])
    .filter((l) => (l.status || "new") !== "converted")
    .map((l) => ({
      id: l.id as string,
      full_name: l.full_name ?? "",
      email: l.email ?? "",
      phone: l.phone ?? undefined,
    }));
}

describe("Invoice lead selector normalization", () => {
  it("filters out converted leads from selector options", () => {
    const rows: LeadLike[] = [
      { id: "1", full_name: "New Lead", email: "new@example.com", status: "new" },
      { id: "2", full_name: "Converted Lead", email: "conv@example.com", status: "converted" },
      { id: "3", full_name: "Contacted Lead", email: "contact@example.com", status: "contacted" },
    ];

    const options = normalizeInvoiceLeadOptions(rows);

    expect(options.map((o) => o.id)).toEqual(["1", "3"]);
  });

  it("is robust to missing or partial records", () => {
    const rows: LeadLike[] = [
      { id: "1", status: "new" },
      // Converted should be filtered even if other fields are missing
      { id: "2", status: "converted" },
      // Null status should be treated as new
      { id: "3", full_name: "Anon", email: "anon@example.com", status: null },
    ];

    const options = normalizeInvoiceLeadOptions(rows);

    expect(options.length).toBe(2);
    expect(options.find((o) => o.id === "2")).toBeUndefined();
  });
});
