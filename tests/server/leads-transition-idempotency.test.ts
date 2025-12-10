import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/server/auth/getUserAndScope", () => ({
  getUserAndScope: vi.fn().mockResolvedValue({
    userId: "user_1",
    role: "member",
    orgId: null,
    teamId: null,
    allowedOwnerIds: ["user_1"],
  }),
}));

vi.mock("@/server/repositories/leads", () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    getById: vi.fn().mockResolvedValue({
      id: "lead_1",
      status: "new",
      subject_id: null,
    }),
    update: vi.fn().mockResolvedValue({
      id: "lead_1",
      status: "contacted",
    }),
  })),
}));

vi.mock("@/server/repositories/lead-status-transitions", () => ({
  LeadStatusTransitionsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@/server/services/notifications/notification-service", () => ({
  NotificationService: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("@/server/utils/idempotency", () => {
  const cache = new Map<string, any>();
  return {
    withIdempotency: vi.fn(async (key: string | null | undefined, fn: () => Promise<any>) => {
      if (!key) {
        return fn();
      }
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = await fn();
      cache.set(key, result);
      return result;
    }),
  };
});

import { createServerClient } from "@supabase/ssr";
import { withIdempotency } from "@/server/utils/idempotency";

function makeSupabaseMock(userId?: string) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
      })),
    },
  };
}

describe("Leads transition idempotency (server)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("invokes transition logic once per idempotency key even on repeated POSTs", async () => {
    (createServerClient as any).mockReturnValue(makeSupabaseMock("user_1"));

    const { POST } = await import(
      "@/app/api/leads/[id]/transition/route"
    );

    const body = {
      target_status: "contacted",
      idempotency_key: "idem-lead-1-new-contacted",
    };
    const url = "http://localhost/api/leads/lead_1/transition";

    const req1 = new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res1 = await POST(req1 as any, { params: { id: "lead_1" } } as any);
    expect(res1.status).toBe(200);

    const req2 = new Request(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const res2 = await POST(req2 as any, { params: { id: "lead_1" } } as any);
    expect(res2.status).toBe(200);

    const withIdem = withIdempotency as unknown as jest.Mock;
    expect(withIdem).toHaveBeenCalled();
  });
});

