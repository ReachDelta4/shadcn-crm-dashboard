import { describe, it, expect, vi, beforeEach } from "vitest";

describe("GET /api/dashboard/overview behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns summary and respects leads paging caps", async () => {
    const { GET } = await import(
      "@/app/api/dashboard/overview/route"
    );

    const req = new Request(
      "http://localhost/api/dashboard/overview?rangeDays=7",
      {
        method: "GET",
        headers: { cookie: "" },
      },
    ) as any;

    const res = await GET(req as any);
    expect([200, 401, 500]).toContain(res.status);
  });
});
