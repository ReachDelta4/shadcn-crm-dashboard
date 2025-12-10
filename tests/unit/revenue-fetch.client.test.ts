import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { fetchRevenueReport } from "@/features/dashboard/pages/reports/revenue/query";

describe("fetchRevenueReport (client-side revenue fetch)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          revenue: [{ period: "Mar", total_revenue_minor: 1200 }],
          pending_total_minor: 50,
        }),
      } as any;
    }) as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch as any;
    vi.restoreAllMocks();
  });

  it("calls /api/reports/revenue with query params and forwards AbortSignal", async () => {
    const controller = new AbortController();

    const from = new Date("2024-03-01T00:00:00Z");
    const to = new Date("2024-03-31T00:00:00Z");

    const result = await fetchRevenueReport(
      {
        groupBy: "month",
        from,
        to,
      },
      controller.signal,
    );

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/api/reports/revenue?");
    expect(url).toContain("groupBy=month");
    expect(url).toContain(encodeURIComponent(from.toISOString()));
    expect(url).toContain(encodeURIComponent(to.toISOString()));

    expect((init as any).signal).toBe(controller.signal);

    expect(result.revenue).toEqual([{ period: "Mar", total_revenue_minor: 1200 }]);
    expect(result.kpis.pending_total_minor).toBe(50);
  });
});

