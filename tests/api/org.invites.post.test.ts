import { describe, it, expect, vi, beforeEach } from "vitest";

const adminFrom = vi.fn((table: string) => {
  if (table === "invites") {
    return {
      insert: vi.fn(() => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "invite-1", token: "token-123" },
              error: null,
            }),
        }),
      })),
      select: vi.fn(() => ({
        eq: () => ({
          order: () =>
            Promise.resolve({
              data: [],
              error: null,
            }),
        }),
      })),
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

const inviteUserByEmail = vi.fn(async () => ({}));

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
    auth: {
      admin: {
        inviteUserByEmail,
      },
    },
  },
}));

vi.mock("@/server/org/seatLimits", () => ({
  fetchSeatState: fetchSeatStateMock,
  willExceedSeatLimit: willExceedSeatLimitMock,
}));

const makeSupabaseMock = (memberships: any[], userId = "user-1") => ({
  auth: {
    getUser: vi.fn(async () => ({
      data: {
        user: userId
          ? { id: userId, email: "owner@example.com" }
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

describe("POST /api/org/invites", () => {
  let createServerClientMock: any;

  beforeEach(async () => {
    const mod = await import("@supabase/ssr");
    createServerClientMock = mod.createServerClient as any;
    createServerClientMock.mockReset();
    adminFrom.mockClear();
    inviteUserByEmail.mockReset();
    fetchSeatStateMock.mockReset();
    willExceedSeatLimitMock.mockReset();
    fetchSeatStateMock.mockResolvedValue({
      limits: { admins: 1, managers: 1, supervisors: 1, users: 10 },
      usage: { admins: 0, managers: 0, supervisors: 0, users: 0 },
    });
    willExceedSeatLimitMock.mockReturnValue({ allowed: true });
  });

  it("returns 401 when unauthorized", async () => {
    const supabase = makeSupabaseMock([], "" as any);
    createServerClientMock.mockResolvedValueOnce(supabase);
    const { POST } = await import("@/app/api/org/invites/route");
    const res = await POST(
      new Request("http://localhost/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user2@example.com",
          role: "sales_rep",
        }),
      }) as any
    );
    expect(res.status).toBe(401);
  });

  it("creates invite and triggers Supabase email", async () => {
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

    const { POST } = await import("@/app/api/org/invites/route");
    const res = await POST(
      new Request("http://localhost/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost" },
        body: JSON.stringify({
          email: "user2@example.com",
          role: "sales_rep",
        }),
      }) as any
    );

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("invite-1");
    expect(json.token).toBe("token-123");
    expect(inviteUserByEmail).toHaveBeenCalledTimes(1);
    expect(inviteUserByEmail).toHaveBeenCalledWith(
      "user2@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/org/invite/"),
      })
    );
  });

  it("returns 409 when seat limit is exceeded", async () => {
    const supabase = makeSupabaseMock([
      {
        org_id: "org-1",
        org_type: "enterprise",
        org_status: "active",
        seat_limit_reps: 1,
        license_expires_at: "2025-12-31T00:00:00Z",
        member_role: "org_admin",
        member_status: "active",
        team_id: null,
      },
    ]);
    createServerClientMock.mockResolvedValueOnce(supabase);
    willExceedSeatLimitMock.mockReturnValueOnce({
      allowed: false,
      reason: "Seat limit reached",
    });

    const { POST } = await import("@/app/api/org/invites/route");
    const res = await POST(
      new Request("http://localhost/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user2@example.com",
          role: "sales_rep",
        }),
      }) as any
    );

    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/Seat limit/i);
    expect(inviteUserByEmail).not.toHaveBeenCalled();
  });

  it("returns 502 when Supabase email sending fails", async () => {
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
    inviteUserByEmail.mockRejectedValueOnce(new Error("SMTP failure"));

    const { POST } = await import("@/app/api/org/invites/route");
    const res = await POST(
      new Request("http://localhost/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "http://localhost" },
        body: JSON.stringify({
          email: "user2@example.com",
          role: "sales_rep",
        }),
      }) as any
    );

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/Failed to send invite email/);
  });
});
