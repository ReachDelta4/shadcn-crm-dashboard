import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { fetchOverview } from "@/features/dashboard/pages/overview";

describe("fetchOverview (client-side dashboard summary)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).fetch = vi.fn(async (_url: string) => {
      return {
        ok: true,
        json: async () => ({
          metrics: { totalLeads: 10, totalCustomers: 5 },
          stages: [],
          leadSources: [],
          recentActivity: [],
        }),
      } as any;
    }) as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch as any;
    vi.restoreAllMocks();
  });

  it("calls /api/dashboard/overview exactly once with rangeDays param and returns summary", async () => {
    const summary = await fetchOverview(7);

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const firstCallUrl = mockFetch.mock.calls[0][0] as string;

    expect(firstCallUrl).toContain("/api/dashboard/overview");
    expect(firstCallUrl).toContain("rangeDays=7");

    expect(summary).toMatchObject({
      metrics: expect.any(Object),
      stages: expect.any(Array),
      leadSources: expect.any(Array),
      recentActivity: expect.any(Array),
    });
  });
});

