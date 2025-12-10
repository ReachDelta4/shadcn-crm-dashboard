import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/server/repositories/lead-appointments", () => ({
  LeadAppointmentsRepository: vi.fn().mockImplementation(() => ({
    listUpcomingBetween: vi.fn().mockResolvedValue([
      {
        id: "appt1",
        lead_id: "lead_1",
        start_at_utc: new Date().toISOString(),
        end_at_utc: new Date(Date.now() + 3600_000).toISOString(),
        title: "Call",
      },
    ]),
  })),
}));

function makeSupabaseMock(userId?: string) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: userId ? { id: userId } : null },
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "invoice_payment_schedules") {
        return {
          select: () => ({
            order: () => ({
              limit: () => ({
                eq: () => ({
                  gte: () => ({
                    lte: () => ({
                      data: [
                        {
                          id: "ps1",
                          invoice_id: "inv1",
                          invoice_line_id: "line1",
                          installment_num: 1,
                          due_at_utc: new Date().toISOString(),
                          amount_minor: 1000,
                          description: "Pay 1",
                          status: "pending",
                          invoices: { owner_id: userId },
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "recurring_revenue_schedules") {
        return {
          select: () => ({
            order: () => ({
              limit: () => ({
                eq: () => ({
                  gte: () => ({
                    lte: () => ({
                      data: [
                        {
                          id: "rr1",
                          invoice_line_id: "line2",
                          cycle_num: 1,
                          billing_at_utc: new Date().toISOString(),
                          amount_minor: 500,
                          description: "Bill 1",
                          status: "scheduled",
                          invoice_lines: { invoice_id: "inv2" },
                          invoices: { owner_id: userId },
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  };
}

import { createServerClient } from "@supabase/ssr";

describe("calendar events aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("aggregates appointments, payment schedules, and recurring schedules into events", async () => {
    (createServerClient as any).mockReturnValueOnce(makeSupabaseMock("user_1"));

    const { GET } = await import(
      "@/app/api/calendar/events/route"
    );

    const url = new URL("http://localhost/api/calendar/events");
    url.searchParams.set("from", "invalid-date");
    url.searchParams.set("to", "invalid-date");

    const res = await GET(new Request(url) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.events)).toBe(true);
    // Expect at least three events: one appointment, one payment schedule, one recurring schedule
    expect(json.events.length).toBeGreaterThanOrEqual(3);
  });
});

