import { describe, it, expect, vi, beforeEach } from "vitest";

let inviteRow: any = null;
let memberRow: any = null;

const adminFrom = vi.fn((table: string) => {
  if (table === "invites") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            gt: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: inviteRow,
                  error: null,
                }),
            }),
          }),
        }),
      }),
      update: () => ({
        eq: () =>
          Promise.resolve({
            error: null,
          }),
      }),
    };
  }
  if (table === "organization_members") {
    return {
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: memberRow,
                error: null,
              }),
          }),
        }),
      }),
      insert: () =>
        Promise.resolve({
          error: null,
        }),
    };
  }
  if (table === "organizations") {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: () =>
            Promise.resolve({
              data: {
                status: "active",
                license_expires_at: "2025-12-31T00:00:00Z",
              },
              error: null,
            }),
        }),
      }),
    };
  }
  return {
    select: () => ({
      eq: () => ({
        maybeSingle: () =>
          Promise.resolve({
            data: null,
            error: null,
          }),
      }),
    }),
  };
});

const fetchSeatStateMock = vi.fn(async () => ({
  limits: { admins: 1, managers: 1, supervisors: 1, users: 10 },
  usage: { admins: 0, managers: 0, supervisors: 0, users: 0 },
}));

const willExceedSeatLimitMock = vi.fn(() => ({ allowed: true }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/server/supabase", () => ({
  supabaseAdmin: {
    from: adminFrom,
  },
}));

vi.mock("@/server/org/seatLimits", () => ({
  fetchSeatState: fetchSeatStateMock,
  willExceedSeatLimit: willExceedSeatLimitMock,
}));

const makeSupabaseMock = (userId = "user-1", email = "user@example.com") => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: {
        user: userId
          ? {
              id: userId,
              email,
            }
          : null,
      },
      error: null,
    })),
  },
});

describe("POST /api/org/invites/accept", () => {
  let createServerClientMock: any;

  beforeEach(async () => {
    const mod = await import("@supabase/ssr");
    createServerClientMock = mod.createServerClient as any;
    createServerClientMock.mockReset();
    adminFrom.mockClear();
    fetchSeatStateMock.mockReset();
    willExceedSeatLimitMock.mockReset();
    fetchSeatStateMock.mockResolvedValue({
      limits: { admins: 1, managers: 1, supervisors: 1, users: 10 },
      usage: { admins: 0, managers: 0, supervisors: 0, users: 0 },
    });
    willExceedSeatLimitMock.mockReturnValue({ allowed: true });
    inviteRow = null;
    memberRow = null;
  });

  it("returns 401 when unauthorized", async () => {
    const supabase = makeSupabaseMock("" as any, "" as any);
    createServerClientMock.mockResolvedValueOnce(supabase);
    const { POST } = await import(
      "@/app/api/org/invites/accept/route"
    );
    const res = await POST(
      new Request("http://localhost/api/org/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "token-123" }),
      }) as any
    );
    expect(res.status).toBe(401);
  });

  it("accepts invite and creates membership when data is valid", async () => {
    const supabase = makeSupabaseMock("user-1", "user@example.com");
    createServerClientMock.mockResolvedValueOnce(supabase);
    inviteRow = {
      id: "invite-1",
      org_id: "org-1",
      email: "user@example.com",
      role: "sales_rep",
      status: "pending",
      expires_at: "2099-12-31T00:00:00Z",
    };
    memberRow = null;

    const { POST } = await import(
      "@/app/api/org/invites/accept/route"
    );
    const res = await POST(
      new Request("http://localhost/api/org/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "token-123" }),
      }) as any
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.accepted).toBe(true);
    expect(json.orgId).toBe("org-1");
  });

  it("returns 403 when invite email does not match signed-in user", async () => {
    const supabase = makeSupabaseMock("user-1", "other@example.com");
    createServerClientMock.mockResolvedValueOnce(supabase);
    inviteRow = {
      id: "invite-1",
      org_id: "org-1",
      email: "user@example.com",
      role: "sales_rep",
      status: "pending",
      expires_at: "2099-12-31T00:00:00Z",
    };

    const { POST } = await import(
      "@/app/api/org/invites/accept/route"
    );
    const res = await POST(
      new Request("http://localhost/api/org/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "token-123" }),
      }) as any
    );

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/does not match/i);
  });
});

