import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/server/repositories/leads", () => ({
  LeadsRepository: vi.fn().mockImplementation(() => ({
    create: vi.fn().mockResolvedValue({
      id: "lead_1",
      full_name: "Jane Doe",
      email: "jane@example.com",
      status: "new",
    }),
  })),
}));

vi.mock("@/app/api/_lib/log-activity", () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

import { createServerClient } from "@supabase/ssr";
import { clearIdempotencyCache } from "@/server/utils/idempotency";

function makeSupabaseMock(userId?: string) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
      })),
    },
  };
}

describe("POST /api/leads idempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearIdempotencyCache();
  });

  it("uses a normalized key so repeated requests with Idempotency-Key create only one lead", async () => {
    (createServerClient as any).mockReturnValue(makeSupabaseMock("u1"));

    const { LeadsRepository } = await import("@/server/repositories/leads");
    const createMock = vi.fn().mockResolvedValue({
      id: "lead_1",
      full_name: "Jane Doe",
      email: "jane@example.com",
      status: "new",
    });
    (LeadsRepository as any).mockImplementation(() => ({
      create: createMock,
    }));

    const { POST } = await import("@/app/api/leads/route");

    const body = {
      full_name: "Jane Doe",
      email: "jane@example.com",
      phone: "+1 555 000 1234",
    };

    const reqInit: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": "invoice-auto-lead",
      },
      body: JSON.stringify(body),
    };

    const res1 = await POST(
      new Request("http://localhost/api/leads", reqInit) as any,
    );
    const res2 = await POST(
      new Request("http://localhost/api/leads", reqInit) as any,
    );

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);

    expect(createMock).toHaveBeenCalledTimes(1);

    const json1 = await res1.json();
    const json2 = await res2.json();

    expect(json1.id).toBe("lead_1");
    expect(json2.id).toBe("lead_1");
  });
});

