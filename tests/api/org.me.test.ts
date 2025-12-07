import { describe, it, expect, vi, beforeEach } from "vitest";

const adminFrom = vi.fn((table: string) => {
  if (table === "organizations") {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: { name: "Acme Corp" },
              error: null,
            }),
        }),
      }),
    };
  }
  return { select: () => ({}) };
});

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/server/supabase", () => ({
  supabaseAdmin: {
    from: adminFrom,
  },
}));

const makeSupabaseMock = (memberships: any[], userId = "user-1") => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: { user: userId ? { id: userId, email: "user@example.com" } : null },
      error: null,
    })),
  },
  rpc: vi.fn(async (fn: string) => {
    if (fn === "get_user_memberships") {
      return { data: memberships, error: null };
    }
    return { data: null, error: null };
  }),
});

describe("GET /api/org/me", () => {
  let createServerClientMock: any;

  beforeEach(async () => {
    const mod = await import("@supabase/ssr");
    createServerClientMock = mod.createServerClient as any;
    createServerClientMock.mockReset();
    adminFrom.mockReset();
  });

  it("returns 401 when unauthorized", async () => {
    const supabase = makeSupabaseMock([], "" as any);
    createServerClientMock.mockResolvedValueOnce(supabase);
    const { GET } = await import("@/app/api/org/me/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns org name and role for active membership", async () => {
    const supabase = makeSupabaseMock([
      {
        org_id: "org-1",
        org_type: "enterprise",
        org_status: "active",
        seat_limit_reps: 5,
        license_expires_at: "2025-12-31T00:00:00Z",
        member_role: "org_admin",
        member_status: "active",
        team_id: null,
      },
    ]);
    createServerClientMock.mockResolvedValueOnce(supabase);

    const { GET } = await import("@/app/api/org/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orgId).toBe("org-1");
    expect(json.orgRole).toBe("org_admin");
    expect(json.orgName).toBe("Acme Corp");
  });

  it("returns null org fields when no memberships", async () => {
    const supabase = makeSupabaseMock([]);
    createServerClientMock.mockResolvedValueOnce(supabase);

    const { GET } = await import("@/app/api/org/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orgId).toBeNull();
    expect(json.orgRole).toBeNull();
    expect(json.orgName).toBeNull();
  });
});

