import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/server/auth/getUserAndScope", () => ({
  getUserAndScope: vi.fn().mockResolvedValue({
    userId: "user-1",
    role: "owner",
    teamId: null,
    orgId: null,
    allowedOwnerIds: ["user-1"],
  }),
}));

vi.mock("@/server/repositories/leads", () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    list: vi.fn().mockResolvedValue({
      data: [
        { status: "new", source: "website" },
        { status: "converted", source: "referral" },
      ],
      page: 0,
      pageSize: 100,
      totalPages: 1,
    }),
  })),
}));

import { createServerClient } from "@supabase/ssr";

function makeSupabaseMock(userId?: string) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
      })),
    },
  };
}

describe("GET /api/dashboard/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: any) => {
        const url = typeof input === "string" ? input : input.url;
        if (url.includes("/api/reports/revenue")) {
          return new Response(
            JSON.stringify({
              realized_total_minor: 0,
              realized_net_revenue_minor: 0,
              realized_tax_minor: 0,
              pending_total_minor: 0,
              pending_net_revenue_minor: 0,
              pending_tax_minor: 0,
              draft_total_minor: 0,
              lead_potential_minor: 0,
              gross_profit_minor: 0,
              gross_margin_percent: 0,
            }),
            { status: 200 },
          );
        }
        if (url.includes("/api/customers")) {
          return new Response(JSON.stringify({ count: 0 }), { status: 200 });
        }
        if (url.includes("/api/activity-logs")) {
          return new Response(JSON.stringify({ data: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({ error: "not found" }), {
          status: 404,
        });
      }),
    );
  });

  it("returns overview summary with metrics and breakdowns", async () => {
    (createServerClient as any).mockReturnValueOnce(makeSupabaseMock("user-1"));
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

    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json).toHaveProperty("metrics");
    expect(json).toHaveProperty("stages");
    expect(json).toHaveProperty("leadSources");
    expect(json).toHaveProperty("recentActivity");
  });
});
