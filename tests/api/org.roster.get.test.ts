import { describe, it, expect, vi, beforeEach } from "vitest";

let orgMembers: any[] = [];
let profileRows: any[] = [];

const adminFrom = vi.fn((table: string) => {
  if (table === "organization_members") {
    return {
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: orgMembers,
            error: null,
          }),
      }),
    };
  }
  if (table === "profiles") {
    return {
      select: () => ({
        in: () =>
          Promise.resolve({
            data: profileRows,
            error: null,
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
      data: {
        user: userId
          ? { id: userId, email: "user@example.com" }
          : null,
      },
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

describe("GET /api/org/roster", () => {
  let createServerClientMock: any;

  beforeEach(async () => {
    const mod = await import("@supabase/ssr");
    createServerClientMock = mod.createServerClient as any;
    createServerClientMock.mockReset();
    adminFrom.mockReset();
    orgMembers = [];
    profileRows = [];
  });

  it("returns 401 when unauthorized", async () => {
    const supabase = makeSupabaseMock([], "" as any);
    createServerClientMock.mockResolvedValueOnce(supabase);

    const { GET } = await import("@/app/api/org/roster/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 400 when user has no org membership", async () => {
    const supabase = makeSupabaseMock([]);
    createServerClientMock.mockResolvedValueOnce(supabase);

    const { GET } = await import("@/app/api/org/roster/route");
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it("returns roster entries with names, emails, and roles for active org member", async () => {
    const supabase = makeSupabaseMock([
      {
        org_id: "org-1",
        org_type: "enterprise",
        org_status: "active",
        seat_limit_reps: 5,
        license_expires_at: "2025-12-31T00:00:00Z",
        member_role: "sales_rep",
        member_status: "active",
        team_id: null,
      },
    ]);
    createServerClientMock.mockResolvedValueOnce(supabase);

    orgMembers = [
      { user_id: "user-1", role: "org_admin", status: "active" },
      { user_id: "user-2", role: "manager", status: "active" },
      { user_id: "user-3", role: "sales_rep", status: "invited" },
    ];

    profileRows = [
      {
        id: "user-1",
        email: "admin@example.com",
        full_name: "Org Admin",
        avatar_url: null,
      },
      {
        id: "user-2",
        email: "manager@example.com",
        full_name: "Manager User",
        avatar_url: "https://example.com/avatar.png",
      },
      {
        id: "user-3",
        email: "rep@example.com",
        full_name: "Sales Rep",
        avatar_url: null,
      },
    ];

    const { GET } = await import("@/app/api/org/roster/route");
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(Array.isArray(json.members)).toBe(true);
    expect(json.members.length).toBe(3);

    const admin = json.members.find((m: any) => m.userId === "user-1");
    const manager = json.members.find((m: any) => m.userId === "user-2");
    const rep = json.members.find((m: any) => m.userId === "user-3");

    expect(admin).toMatchObject({
      email: "admin@example.com",
      name: "Org Admin",
      role: "org_admin",
      status: "active",
    });
    expect(manager).toMatchObject({
      email: "manager@example.com",
      name: "Manager User",
      role: "manager",
      status: "active",
    });
    expect(rep).toMatchObject({
      email: "rep@example.com",
      name: "Sales Rep",
      role: "sales_rep",
      status: "invited",
    });
  });
});

